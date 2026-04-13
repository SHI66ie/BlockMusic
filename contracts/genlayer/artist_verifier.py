# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class ArtistVerifier(gl.Contract):
    """
    AI-powered artist identity verification for BlockMusic.
    
    Uses GenLayer's web access to verify artist identity by checking
    their social media profiles and cross-referencing with their
    claimed identity on the platform.
    
    Features:
    - Verify artist identity via social media profiles
    - Cross-reference wallet addresses with known artists
    - Issue on-chain verification badges
    """

    owner: Address
    verified_artists: TreeMap[Address, str]  # address -> verification JSON
    verification_requests: TreeMap[Address, str]  # address -> request JSON
    total_verified: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.total_verified = u256(0)

    @gl.public.write
    def request_verification(
        self,
        artist_name: str,
        twitter_handle: str,
        website_url: str,
        wallet_address_claim: str,
    ) -> None:
        """
        Request artist verification by providing social proof.
        The contract will verify the identity using web access.
        """

        def verify_identity():
            results = []

            # Check Twitter/X profile
            if twitter_handle:
                try:
                    twitter_page = gl.get_webpage(
                        f"https://x.com/{twitter_handle}",
                        mode="text"
                    )
                    twitter_found = artist_name.lower() in twitter_page.lower()
                    results.append(f"Twitter: {'found' if twitter_found else 'not_found'}")
                except Exception:
                    results.append("Twitter: check_failed")

            # Check website
            if website_url:
                try:
                    website_page = gl.get_webpage(website_url, mode="text")
                    wallet_on_site = wallet_address_claim.lower() in website_page.lower()
                    name_on_site = artist_name.lower() in website_page.lower()
                    results.append(
                        f"Website: name_{'found' if name_on_site else 'not_found'}, "
                        f"wallet_{'found' if wallet_on_site else 'not_found'}"
                    )
                except Exception:
                    results.append("Website: check_failed")

            evidence = "; ".join(results)

            # Use LLM to make final verification decision
            prompt = (
                f"You are verifying an artist's identity on a music platform.\n\n"
                f"Artist claims:\n"
                f"- Name: {artist_name}\n"
                f"- Twitter: @{twitter_handle}\n"
                f"- Website: {website_url}\n"
                f"- Wallet: {wallet_address_claim}\n\n"
                f"Verification evidence:\n{evidence}\n\n"
                f"Based on the evidence, respond with EXACTLY one of:\n"
                f"VERIFIED - strong evidence that this is a legitimate artist\n"
                f"PENDING - some evidence found but not conclusive\n"
                f"REJECTED - insufficient evidence or contradictory information\n"
            )

            decision = gl.exec_prompt(prompt)
            decision_stripped = decision.strip().upper()

            if decision_stripped.startswith("VERIFIED"):
                return f"VERIFIED|{evidence}"
            elif decision_stripped.startswith("PENDING"):
                return f"PENDING|{evidence}"
            else:
                return f"REJECTED|{evidence}"

        result = gl.eq_principle.str_similarity(
            verify_identity,
            threshold=0.7
        )

        sender = gl.message.sender_address
        status = result.split("|")[0] if "|" in result else result

        verification_data = (
            f'{{"artist_name": "{artist_name}", '
            f'"twitter": "@{twitter_handle}", '
            f'"website": "{website_url}", '
            f'"status": "{status}", '
            f'"full_result": "{result}"}}'
        )

        if status == "VERIFIED":
            self.verified_artists[sender] = verification_data
            self.total_verified = u256(int(self.total_verified) + 1)
        
        self.verification_requests[sender] = verification_data

    @gl.public.view
    def is_verified(self, artist: Address) -> bool:
        """Check if an artist is verified."""
        return artist in self.verified_artists

    @gl.public.view
    def get_verification_status(self, artist: Address) -> str:
        """Get the full verification status for an artist."""
        if artist in self.verification_requests:
            return self.verification_requests[artist]
        return '{"status": "NOT_REQUESTED"}'

    @gl.public.view
    def get_total_verified(self) -> u256:
        """Get total number of verified artists."""
        return self.total_verified
