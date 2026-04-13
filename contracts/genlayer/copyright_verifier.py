# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class CopyrightVerifier(gl.Contract):
    """
    AI-powered copyright verification for BlockMusic uploads.
    
    Uses GenLayer's web access and LLM capabilities to:
    - Check if uploaded track titles match known copyrighted works
    - Verify originality claims by searching web sources
    - Flag potential copyright infringements before they go live
    
    This provides an on-chain, consensus-based copyright check
    that runs before music is published to the platform.
    """

    owner: Address
    verification_results: TreeMap[str, str]  # track_id -> result
    verification_count: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.verification_count = u256(0)

    @gl.public.write
    def verify_copyright(
        self,
        track_id: str,
        track_title: str,
        artist_name: str,
        claimed_original: bool,
        sample_sources: str,
    ) -> None:
        """
        Verify copyright status of a music upload.
        Uses web access to check for existing copyrighted works and 
        LLM analysis for similarity detection.
        """

        # First, try to find the track title on the web
        def check_copyright():
            search_query = f"{track_title} {artist_name} song"
            
            # Use web rendering to check for existing tracks
            try:
                web_result = gl.get_webpage(
                    f"https://www.google.com/search?q={search_query}",
                    mode="text"
                )
            except Exception:
                web_result = "Unable to fetch web results"

            analysis_prompt = (
                f"You are a copyright verification assistant for a music platform.\n\n"
                f"Track being uploaded:\n"
                f"- Title: {track_title}\n"
                f"- Artist: {artist_name}\n"
                f"- Claims to be original: {claimed_original}\n"
                f"- Sample sources listed: {sample_sources}\n\n"
                f"Web search results for this track:\n{web_result[:2000]}\n\n"
                f"Based on the search results, determine if this upload might be:\n"
                f"1. An original work (no matches found)\n"
                f"2. A cover/remix (similar title found but possibly legitimate)\n"
                f"3. A potential copyright infringement (exact match found)\n\n"
                f"Respond with EXACTLY one of:\n"
                f"CLEAR - no copyright concerns found\n"
                f"COVER - appears to be a cover/remix, may need license\n"
                f"FLAGGED:<details> - potential copyright infringement detected\n"
            )

            result = gl.exec_prompt(analysis_prompt)
            result_stripped = result.strip().upper()
            
            if result_stripped.startswith("CLEAR"):
                return "CLEAR"
            elif result_stripped.startswith("COVER"):
                return "COVER"
            elif result_stripped.startswith("FLAGGED"):
                return result.strip()
            else:
                return "CLEAR"

        final_result = gl.eq_principle.str_similarity(
            check_copyright,
            threshold=0.7
        )

        self.verification_results[track_id] = final_result
        self.verification_count = u256(int(self.verification_count) + 1)

    @gl.public.view
    def get_verification_result(self, track_id: str) -> str:
        """Get the copyright verification result for a track."""
        if track_id in self.verification_results:
            return self.verification_results[track_id]
        return "NOT_VERIFIED"

    @gl.public.view
    def get_verification_count(self) -> u256:
        """Get total number of verifications performed."""
        return self.verification_count
