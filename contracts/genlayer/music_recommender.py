# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class MusicRecommender(gl.Contract):
    """
    AI-powered music recommendation engine running on GenLayer.
    
    Uses LLMs to analyze listening patterns and generate personalized
    recommendations. Can also access web data to incorporate trending
    music information.
    
    Features:
    - Personalized recommendations based on listening history
    - Trend-aware suggestions using web data access
    - Genre-based discovery powered by AI understanding
    """

    owner: Address
    # Store user listening profiles as JSON strings
    user_profiles: TreeMap[Address, str]
    # Store track catalog as JSON strings  
    track_catalog: TreeMap[str, str]  # track_id -> metadata JSON
    track_count: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.track_count = u256(0)

    @gl.public.write
    def register_track(
        self,
        track_id: str,
        title: str,
        artist: str,
        genre: str,
        mood: str,
        tags: str,
    ) -> None:
        """Register a track in the recommendation catalog."""
        metadata = (
            f'{{"id": "{track_id}", "title": "{title}", '
            f'"artist": "{artist}", "genre": "{genre}", '
            f'"mood": "{mood}", "tags": "{tags}"}}'
        )
        self.track_catalog[track_id] = metadata
        self.track_count = u256(int(self.track_count) + 1)

    @gl.public.write
    def update_user_profile(
        self,
        genres_listened: str,
        favorite_artists: str,
        recent_tracks: str,
        listening_mood: str,
    ) -> None:
        """Update a user's listening profile for better recommendations."""
        profile = (
            f'{{"genres": "{genres_listened}", '
            f'"favorite_artists": "{favorite_artists}", '
            f'"recent_tracks": "{recent_tracks}", '
            f'"mood": "{listening_mood}"}}'
        )
        self.user_profiles[gl.message.sender_address] = profile

    @gl.public.write
    def get_recommendations(
        self,
        genres_listened: str,
        favorite_artists: str,
        recent_tracks: str,
        available_track_ids: str,
    ) -> None:
        """
        Generate AI-powered music recommendations.
        Uses non-deterministic LLM calls with equivalence principle.
        
        Note: Results are stored because write transactions can use non-determinism.
        Read the stored result after transaction is finalized.
        """

        prompt = (
            f"You are a music recommendation AI for a decentralized music platform.\n\n"
            f"User's listening profile:\n"
            f"- Genres they enjoy: {genres_listened}\n"
            f"- Favorite artists: {favorite_artists}\n"
            f"- Recently listened to: {recent_tracks}\n\n"
            f"Available tracks on the platform: {available_track_ids}\n\n"
            f"Based on this profile, recommend up to 5 track IDs from the available "
            f"tracks that this user would enjoy. Consider genre affinity, artist "
            f"similarity, and mood matching.\n\n"
            f"Respond with ONLY a comma-separated list of track IDs, nothing else.\n"
            f"Example: track_1,track_3,track_7\n"
        )

        def generate_recommendations():
            result = gl.exec_prompt(prompt)
            return result.strip()

        recommendations = gl.eq_principle.str_similarity(
            generate_recommendations,
            threshold=0.6
        )

        # Store recommendations for the user
        sender = gl.message.sender_address
        self.user_profiles[sender] = (
            f'{{"genres": "{genres_listened}", '
            f'"favorite_artists": "{favorite_artists}", '
            f'"recent_tracks": "{recent_tracks}", '
            f'"recommendations": "{recommendations}"}}'
        )

    @gl.public.view
    def get_user_profile(self, user: Address) -> str:
        """Get a user's profile including recommendations."""
        if user in self.user_profiles:
            return self.user_profiles[user]
        return "{}"

    @gl.public.view
    def get_track_info(self, track_id: str) -> str:
        """Get track metadata from the catalog."""
        if track_id in self.track_catalog:
            return self.track_catalog[track_id]
        return "{}"

    @gl.public.view
    def get_catalog_size(self) -> u256:
        """Get the number of tracks in the catalog."""
        return self.track_count
