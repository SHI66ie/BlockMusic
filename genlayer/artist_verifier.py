# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

class ArtistVerifier(gl.Contract):
    """
    Minimal version for testing schema loading.
    No storage, no EVM bridge yet.
    """

    owner: Address

    def __init__(self):
        self.owner = gl.get_tx_sender()

    @gl.public.write
    def verify_artist(
        self,
        artist_name: str,
        social_links: str
    ) -> str:
        prompt = f"""
        Verify if this artist looks legitimate:
        Name: {artist_name}
        Social Links: {social_links}

        Return ONLY: VERIFIED or DENIED:short reason
        """

        result = gl.exec_prompt(
            prompt=prompt,
            temperature=0.5,
            max_tokens=300,
            eq_principle="Verification must be consistent"
        ).strip().upper()

        return result