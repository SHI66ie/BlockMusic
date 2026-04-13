# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


# EVM Interface for the MusicNFT contract on Base
@gl.evm.contract_interface
class MusicNFT:
    class View:
        def ownerOf(self, tokenId: u256) -> Address: ...
        def balanceOf(self, owner: Address) -> u256: ...

    class Write:
        # We can define custom functions here that our GenLayer contract will call
        def setModerationStatus(self, track_id: str, status: bool) -> bool: ...


class MusicContentModerator(gl.Contract):
    """
    AI-powered content moderation for BlockMusic uploads.
    
    This contract demonstrates the HYBRID flow:
    1. Receive metadata for analysis.
    2. Use LLM to reach consensus on policy adherence.
    3. Call back to the Base (EVM) contract to update moderation status.
    """

    owner: Address
    music_nft_address: Address
    moderation_results: TreeMap[str, str]

    def __init__(self, music_nft: Address):
        self.owner = gl.message.sender_address
        self.music_nft_address = music_nft

    @gl.public.write
    def moderate_content(
        self,
        track_id: str,
        track_title: str,
        artist_name: str,
        album_name: str,
        genre: str,
        description: str,
        is_explicit: bool,
    ) -> None:
        """
        Analyze content and update status on BOTH GenLayer and Base.
        """

        metadata_text = f"Title: {track_title}, Artist: {artist_name}, Genre: {genre}, Description: {description}"
        prompt = (
            f"Moderation Task: Analyze if this music upload violates policy (no hate speech, no spam).\n"
            f"Content: {metadata_text}\n"
            f"Respond with: APPROVED or REJECTED:<reason>"
        )

        def run_moderation():
            return gl.exec_prompt(prompt).strip().upper()

        final_result = gl.eq_principle.str_similarity(run_moderation, threshold=0.8)
        self.moderation_results[track_id] = final_result

        # Hybrid Flow: Update Base Sepolia state
        is_approved = final_result == "APPROVED"
        
        # Instantiate the EVM contract interface
        nft = MusicNFT(self.music_nft_address)
        
        # Emit a cross-chain write transaction to Base
        # This will be picked up by GenLayer validators and executed on Base Sepolia
        nft.emit().setModerationStatus(track_id, is_approved)

    @gl.public.view
    def get_moderation_result(self, track_id: str) -> str:
        return self.moderation_results[track_id] if track_id in self.moderation_results else "NOT_MODERATED"
