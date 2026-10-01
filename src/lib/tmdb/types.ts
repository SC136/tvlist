/* Raw TMDB v3 response shapes — only the fields tvlist reads. */

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieListItem {
  media_type?: "movie";
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  overview?: string;
  original_language?: string;
}

export interface TmdbTvListItem {
  media_type?: "tv";
  id: number;
  name: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  overview?: string;
  original_language?: string;
  origin_country?: string[];
}

export interface TmdbPersonListItem {
  media_type?: "person";
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: (TmdbMovieListItem | TmdbTvListItem)[];
}

export type TmdbMultiItem = TmdbMovieListItem | TmdbTvListItem | TmdbPersonListItem;

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

export interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TmdbCastCredit {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

export interface TmdbCrewCredit {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbAggregateCast {
  id: number;
  name: string;
  profile_path: string | null;
  roles: { character: string; episode_count: number }[];
  total_episode_count: number;
  order?: number;
}

export interface TmdbAggregateCrew {
  id: number;
  name: string;
  profile_path: string | null;
  department: string;
  jobs: { job: string; episode_count: number }[];
  total_episode_count: number;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface TmdbWatchProviderRegion {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
  tvdb_id?: number | null;
  wikidata_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
}

interface TmdbDetailsCommon {
  id: number;
  overview: string;
  tagline?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: TmdbGenre[];
  production_companies?: TmdbCompany[];
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
  original_language?: string;
  status?: string;
  homepage?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  videos?: { results: TmdbVideo[] };
  external_ids?: TmdbExternalIds;
  "watch/providers"?: { results: Record<string, TmdbWatchProviderRegion> };
}

export interface TmdbMovieDetails extends TmdbDetailsCommon {
  title: string;
  original_title?: string;
  release_date?: string;
  runtime?: number | null;
  budget?: number;
  revenue?: number;
  imdb_id?: string | null;
  belongs_to_collection?: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
  credits?: { cast: TmdbCastCredit[]; crew: TmdbCrewCredit[] };
  recommendations?: TmdbPaged<TmdbMovieListItem>;
  similar?: TmdbPaged<TmdbMovieListItem>;
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] };
  keywords?: { keywords: { id: number; name: string }[] };
}

export interface TmdbEpisodeSummary {
  id?: number;
  name: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  runtime?: number | null;
  overview?: string;
  still_path?: string | null;
  vote_average?: number;
}

export interface TmdbSeasonSummary {
  id?: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview?: string;
  vote_average?: number;
}

export interface TmdbTvDetails extends TmdbDetailsCommon {
  name: string;
  original_name?: string;
  first_air_date?: string;
  last_air_date?: string | null;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: TmdbSeasonSummary[];
  type?: string;
  in_production?: boolean;
  networks?: TmdbCompany[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  origin_country?: string[];
  next_episode_to_air?: TmdbEpisodeSummary | null;
  last_episode_to_air?: TmdbEpisodeSummary | null;
  aggregate_credits?: { cast: TmdbAggregateCast[]; crew: TmdbAggregateCrew[] };
  recommendations?: TmdbPaged<TmdbTvListItem>;
  similar?: TmdbPaged<TmdbTvListItem>;
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  keywords?: { results: { id: number; name: string }[] };
}

export interface TmdbSeasonDetails {
  id?: number;
  name: string;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  season_number: number;
  episodes: TmdbEpisodeSummary[];
}

export interface TmdbPersonCredit {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  job?: string;
  department?: string;
  episode_count?: number;
  vote_count?: number;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
  overview?: string;
}

export interface TmdbPersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department?: string;
  also_known_as?: string[];
  gender?: number;
  homepage?: string | null;
  combined_credits?: { cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] };
  external_ids?: TmdbExternalIds;
}

export interface TmdbCollectionDetails {
  id: number;
  name: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbMovieListItem[];
}
