# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

# EVM Interface for the MusicNFT contract on Base
@gl.evm.contract_interface
class MusicNFT:
    class Write:
        # Note: We share the same moderation mapping on Base for simplicity
        def setModerationStatus(self, track_id: str, status: bool) -> bool: ...


class CopyrightVerifier(gl.Contract):
    """
    AI-powered copyright infringement detection via web access.
    
    Demonstrates the HYBRID flow:
    1. Search web for similar track titles/artists.
    2. Reach consensus on whether the track is an original or a covered/licensed work.
    3. Call back to Base (EVM) to flag tracks that infringe.
    """

    owner: Address
    music_nft_address: Address
    copyright_status: TreeMap[str, str]

    def __init__(self, music_nft: Address):
        self.owner = gl.message.sender_address
        self.music_nft_address = music_nft

    @gl.public.write
    def verify_copyright(
        self,
        track_id: str,
        track_title: str,
        artist_name: str,
        claimed_original: bool,
        sample_sources: str
    ) -> None:
        """
        Check if track infringes on existing works using GenLayer's web capability.
        """
        
        prompt = (
            f"Copyright Task: Investigate if the track '{track_title}' by '{artist_name}' infringes on existing copyright.\n"
            f"Claimed Original: {claimed_original}\n"
            f"Samples Used: {sample_sources}\n"
            f"Respond with: CLEAR, COVER, or INFRINGING:<reason>"
        )

        def run_copyright_check():
            # In production, this would use gl.get_web_data to search for the title/artist
            # For now, we simulate the LLM reasoning over the metadata
            return gl.exec_prompt(prompt).strip().upper()

        result = gl.eq_principle.str_similarity(run_copyright_check, threshold=0.8)
        self.copyright_status[track_id] = result

        # Hybrid Flow: Inform Base contract if track is INFRINGING
        # If it's infringing, we explicitly set status to false on Base to block minting
        if result.startswith("INFRINGING"):
            nft = MusicNFT(self.music_nft_address)
            nft.emit().setModerationStatus(track_id, False)

    @gl.public.view
    def get_copyright_status(self, track_id: str) -> str:
        return self.copyright_status[track_id] if track_id in self.copyright_status else "NOT_VERIFIED"
