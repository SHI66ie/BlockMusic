# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class MusicContentModerator(gl.Contract):
    """
    AI-powered content moderation for BlockMusic uploads.
    
    Uses GenLayer's LLM integration and Equivalence Principle to ensure
    consensus among validators on moderation decisions.
    
    Features:
    - Analyze music metadata for policy violations
    - Check cover art descriptions for inappropriate content
    - Verify track titles and descriptions for hate speech, spam, etc.
    - Maintain a moderation log on-chain
    """

    owner: Address
    moderation_results: TreeMap[str, str]  # track_id -> result JSON
    moderation_count: u256
    appeal_count: u256
    
    # Content policy (can be updated by owner)
    content_policy: str

    def __init__(self):
        self.owner = gl.message.sender_address
        self.moderation_count = u256(0)
        self.appeal_count = u256(0)
        self.content_policy = (
            "BlockMusic Content Policy:\n"
            "1. No hate speech, slurs, or discriminatory language in titles or descriptions\n"
            "2. No promotion of violence or illegal activities\n"
            "3. No spam, misleading metadata, or impersonation\n"
            "4. Cover art must not contain explicit imagery without proper tagging\n"
            "5. No copyright-infringing titles that impersonate known artists\n"
            "6. Genre classification must be accurate and not misleading\n"
        )

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
        Perform AI-powered content moderation on a music upload.
        Uses non-deterministic LLM calls with equivalence principle for consensus.
        """

        metadata_text = (
            f"Track Title: {track_title}\n"
            f"Artist Name: {artist_name}\n"
            f"Album: {album_name}\n"
            f"Genre: {genre}\n"
            f"Description: {description}\n"
            f"Marked as Explicit: {is_explicit}\n"
        )

        prompt = (
            f"You are a content moderator for a decentralized music platform.\n\n"
            f"Content Policy:\n{self.content_policy}\n\n"
            f"Analyze the following music upload metadata and determine if it "
            f"violates any content policies:\n\n"
            f"{metadata_text}\n\n"
            f"Respond with EXACTLY one of these formats:\n"
            f"APPROVED - if the content follows all policies\n"
            f"FLAGGED:<reason> - if the content violates a policy, with a brief reason\n"
            f"REVIEW:<reason> - if the content needs human review, with a brief reason\n"
        )

        def run_moderation():
            result = gl.exec_prompt(prompt)
            # Normalize the result
            result_stripped = result.strip().upper()
            if result_stripped.startswith("APPROVED"):
                return "APPROVED"
            elif result_stripped.startswith("FLAGGED"):
                return result.strip()
            elif result_stripped.startswith("REVIEW"):
                return result.strip()
            else:
                return "REVIEW:Ambiguous moderation result"

        final_result = gl.eq_principle.str_similarity(
            run_moderation,
            threshold=0.7
        )

        self.moderation_results[track_id] = final_result
        self.moderation_count = u256(int(self.moderation_count) + 1)

    @gl.public.view
    def get_moderation_result(self, track_id: str) -> str:
        """Get the moderation result for a specific track."""
        if track_id in self.moderation_results:
            return self.moderation_results[track_id]
        return "NOT_MODERATED"

    @gl.public.view
    def get_moderation_stats(self) -> str:
        """Get overall moderation statistics."""
        return f'{{"total_moderated": {self.moderation_count}, "total_appeals": {self.appeal_count}}}'

    @gl.public.write
    def update_content_policy(self, new_policy: str) -> None:
        """Update the content policy (owner only)."""
        assert gl.message.sender_address == self.owner, "Only owner can update policy"
        self.content_policy = new_policy

    @gl.public.view
    def get_content_policy(self) -> str:
        """Get the current content policy."""
        return self.content_policy
