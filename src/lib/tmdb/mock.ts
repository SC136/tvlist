/**
 * Demo catalog served when TMDB_API_KEY is not configured, so the site is
 * fully usable in development before credentials exist. Responses mimic the
 * TMDB v3 shapes the real client reads. Image paths point at real TMDB images
 * (the image CDN needs no key). Synopses are short originals, not TMDB copy.
 */
import type {
  TmdbCollectionDetails,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonCredit,
  TmdbPersonDetails,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbTvListItem,
} from "./types";

type Person = { id: number; name: string; profile: string | null; dept: string; bio: string; born?: string; place?: string };

const PEOPLE: Person[] = [
  { id: 287, name: "Brad Pitt", profile: "/cckcYc2v0yh1tc9QjRelptcOBko.jpg", dept: "Acting", bio: "American actor and producer.", born: "1963-12-18", place: "Shawnee, Oklahoma, USA" },
  { id: 819, name: "Edward Norton", profile: "/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg", dept: "Acting", bio: "American actor and filmmaker.", born: "1969-08-18", place: "Boston, Massachusetts, USA" },
  { id: 7467, name: "David Fincher", profile: null, dept: "Directing", bio: "American film director known for meticulous thrillers.", born: "1962-08-28" },
  { id: 525, name: "Christopher Nolan", profile: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg", dept: "Directing", bio: "British-American filmmaker known for large-scale, puzzle-box blockbusters.", born: "1970-07-30", place: "London, England, UK" },
  { id: 6193, name: "Leonardo DiCaprio", profile: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg", dept: "Acting", bio: "American actor and film producer.", born: "1974-11-11", place: "Los Angeles, California, USA" },
  { id: 2037, name: "Cillian Murphy", profile: "/llkbyWKwpfowZ6C8peBjIV9jj99.jpg", dept: "Acting", bio: "Irish actor.", born: "1976-05-25", place: "Douglas, Cork, Ireland" },
  { id: 3894, name: "Christian Bale", profile: "/7Pxez9J8fuPd2Mn9kex13YALrCQ.jpg", dept: "Acting", bio: "English actor known for intense transformations.", born: "1974-01-30" },
  { id: 192, name: "Morgan Freeman", profile: "/jPsLqiYGSofU4s6BjrxnefMfabb.jpg", dept: "Acting", bio: "American actor and narrator.", born: "1937-06-01", place: "Memphis, Tennessee, USA" },
  { id: 10297, name: "Matthew McConaughey", profile: "/lCySuYjhXix3FzQdS4oceDDrXKI.jpg", dept: "Acting", bio: "American actor.", born: "1969-11-04" },
  { id: 20738, name: "Song Kang-ho", profile: null, dept: "Acting", bio: "South Korean actor.", born: "1967-01-17" },
  { id: 21684, name: "Bong Joon-ho", profile: null, dept: "Directing", bio: "South Korean filmmaker.", born: "1969-09-14" },
  { id: 504, name: "Tim Robbins", profile: "/djLVFETFTvPyVUdrd7aLVykobof.jpg", dept: "Acting", bio: "American actor and director.", born: "1958-10-16" },
  { id: 4027, name: "Frank Darabont", profile: null, dept: "Directing", bio: "American filmmaker and screenwriter.", born: "1959-01-28" },
  { id: 3084, name: "Marlon Brando", profile: "/fuTEPMsBtV1zE98ujPONbKiYDc2.jpg", dept: "Acting", bio: "American actor.", born: "1924-04-03" },
  { id: 1158, name: "Al Pacino", profile: "/fMDFeVf0pjopTJbyRSLFwNDm8Wr.jpg", dept: "Acting", bio: "American actor.", born: "1940-04-25" },
  { id: 1776, name: "Francis Ford Coppola", profile: "/mGKkVp3l9cipPt10AqoQnwaPrfI.jpg", dept: "Directing", bio: "American filmmaker.", born: "1939-04-07" },
  { id: 138, name: "Quentin Tarantino", profile: "/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg", dept: "Directing", bio: "American filmmaker known for nonlinear, dialogue-driven films.", born: "1963-03-27" },
  { id: 8891, name: "John Travolta", profile: null, dept: "Acting", bio: "American actor.", born: "1954-02-18" },
  { id: 2231, name: "Samuel L. Jackson", profile: "/AiAYAqwpM5xmiFrAIeQvUXDCVvo.jpg", dept: "Acting", bio: "American actor.", born: "1948-12-21" },
  { id: 6384, name: "Keanu Reeves", profile: "/4D0PpNI0kmP58hgrwGC3wCjxhnm.jpg", dept: "Acting", bio: "Canadian actor.", born: "1964-09-02" },
  { id: 9340, name: "Lana Wachowski", profile: null, dept: "Directing", bio: "American filmmaker.", born: "1965-06-21" },
  { id: 31, name: "Tom Hanks", profile: "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg", dept: "Acting", bio: "American actor and filmmaker.", born: "1956-07-09" },
  { id: 24, name: "Robert Zemeckis", profile: null, dept: "Directing", bio: "American filmmaker.", born: "1952-05-14" },
  { id: 109, name: "Elijah Wood", profile: null, dept: "Acting", bio: "American actor.", born: "1981-01-28" },
  { id: 108, name: "Peter Jackson", profile: null, dept: "Directing", bio: "New Zealand filmmaker.", born: "1961-10-31" },
  { id: 608, name: "Hayao Miyazaki", profile: "/mG3cfxtA5jqDc7fpKgyzZMKoXDh.jpg", dept: "Directing", bio: "Japanese animator and filmmaker, co-founder of Studio Ghibli.", born: "1941-01-05" },
  { id: 19587, name: "Rumi Hiiragi", profile: null, dept: "Acting", bio: "Japanese actress.", born: "1987-08-01" },
  { id: 1190668, name: "Timothée Chalamet", profile: "/BE2sdjpgsa2rNTFa66f7upkaOP.jpg", dept: "Acting", bio: "American actor.", born: "1995-12-27" },
  { id: 505710, name: "Zendaya", profile: "/3WdOloHpjtjL96uVOhFRRCcYSwq.jpg", dept: "Acting", bio: "American actress and singer.", born: "1996-09-01" },
  { id: 137427, name: "Denis Villeneuve", profile: "/zdDx9Xs93UIrJFWYApYR28J8M6b.jpg", dept: "Directing", bio: "Canadian filmmaker.", born: "1967-10-03" },
  { id: 587506, name: "Shameik Moore", profile: null, dept: "Acting", bio: "American actor.", born: "1995-05-04" },
  { id: 3223, name: "Robert Downey Jr.", profile: null, dept: "Acting", bio: "American actor.", born: "1965-04-04" },
  { id: 19271, name: "Anthony Russo", profile: null, dept: "Directing", bio: "American filmmaker.", born: "1970-02-03" },
  { id: 234352, name: "Margot Robbie", profile: null, dept: "Acting", bio: "Australian actress and producer.", born: "1990-07-02" },
  { id: 45400, name: "Greta Gerwig", profile: null, dept: "Directing", bio: "American filmmaker and actress.", born: "1983-08-04" },
  { id: 1620, name: "Michelle Yeoh", profile: null, dept: "Acting", bio: "Malaysian actress.", born: "1962-08-06" },
  { id: 1383612, name: "Daniel Kwan", profile: null, dept: "Directing", bio: "American filmmaker, one half of Daniels.", born: "1988-02-10" },
  { id: 10980, name: "Daniel Radcliffe", profile: null, dept: "Acting", bio: "English actor.", born: "1989-07-23" },
  { id: 10965, name: "Chris Columbus", profile: null, dept: "Directing", bio: "American filmmaker.", born: "1958-09-10" },
  { id: 2, name: "Mark Hamill", profile: null, dept: "Acting", bio: "American actor.", born: "1951-09-25" },
  { id: 1, name: "George Lucas", profile: null, dept: "Directing", bio: "American filmmaker.", born: "1944-05-14" },
  { id: 65731, name: "Sam Worthington", profile: null, dept: "Acting", bio: "Australian actor.", born: "1976-08-02" },
  { id: 2710, name: "James Cameron", profile: null, dept: "Directing", bio: "Canadian filmmaker.", born: "1954-08-16" },
  { id: 17419, name: "Bryan Cranston", profile: "/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg", dept: "Acting", bio: "American actor.", born: "1956-03-07" },
  { id: 84497, name: "Aaron Paul", profile: "/8Ac9uuoYwZoYVAIJfRLzzLsGGJn.jpg", dept: "Acting", bio: "American actor.", born: "1979-08-27" },
  { id: 66633, name: "Vince Gilligan", profile: "/z3E0DhBg1V1PZVEtS9vfFPzOWYB.jpg", dept: "Writing", bio: "American writer, producer and director.", born: "1967-02-10" },
  { id: 1223786, name: "Emilia Clarke", profile: "/86jeYFV40KctQMDQIWhJ5oviNGj.jpg", dept: "Acting", bio: "English actress.", born: "1986-10-23" },
  { id: 239019, name: "Kit Harington", profile: null, dept: "Acting", bio: "English actor.", born: "1986-12-26" },
  { id: 9813, name: "David Benioff", profile: null, dept: "Writing", bio: "American writer and producer.", born: "1970-09-25" },
  { id: 1356210, name: "Millie Bobby Brown", profile: "/3Qblbk5JIMxzlGVd1k1ucSKK7rf.jpg", dept: "Acting", bio: "British actress.", born: "2004-02-19" },
  { id: 1179419, name: "Matt Duffer", profile: null, dept: "Writing", bio: "American writer and director.", born: "1984-02-15" },
  { id: 4491, name: "Jennifer Aniston", profile: null, dept: "Acting", bio: "American actress.", born: "1969-02-11" },
  { id: 1253360, name: "Pedro Pascal", profile: "/9VYK7oxcqhjd5LAH6ZFJ3XzOlID.jpg", dept: "Acting", bio: "Chilean-American actor.", born: "1975-04-02" },
];

const personById = new Map(PEOPLE.map((p) => [p.id, p]));

type MovieFixture = {
  id: number;
  title: string;
  date: string;
  poster: string;
  backdrop: string | null;
  genres: number[];
  vote: number;
  votes: number;
  runtime: number;
  overview: string;
  cast: [number, string][];
  directors: number[];
  companies: string[];
  country: string;
  lang: string;
  cert: string;
  collection?: number;
  keywords: string[];
};

const MOVIES: MovieFixture[] = [
  { id: 550, title: "Fight Club", date: "1999-10-15", poster: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", backdrop: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg", genres: [18, 53], vote: 8.4, votes: 31000, runtime: 139, overview: "An insomniac office worker and a reckless soap salesman start an underground club that spirals into something far bigger.", cast: [[819, "The Narrator"], [287, "Tyler Durden"]], directors: [7467], companies: ["Fox 2000 Pictures", "Regency Enterprises"], country: "US", lang: "en", cert: "R", keywords: ["dual identity", "insomnia", "anti-consumerism"] },
  { id: 27205, title: "Inception", date: "2010-07-15", poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", backdrop: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg", genres: [28, 878, 12], vote: 8.4, votes: 38000, runtime: 148, overview: "A thief who steals secrets from inside dreams is offered one last job: planting an idea instead of taking one.", cast: [[6193, "Dom Cobb"], [2037, "Robert Fischer"]], directors: [525], companies: ["Legendary Pictures", "Syncopy"], country: "US", lang: "en", cert: "PG-13", keywords: ["dream", "heist", "subconscious"] },
  { id: 155, title: "The Dark Knight", date: "2008-07-16", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", genres: [18, 28, 80, 53], vote: 8.5, votes: 34000, runtime: 152, overview: "Gotham's masked vigilante faces an agent of chaos who wants to prove anyone can be pushed to the edge.", cast: [[3894, "Bruce Wayne"], [192, "Lucius Fox"], [2037, "Scarecrow"]], directors: [525], companies: ["Warner Bros. Pictures", "Syncopy"], country: "US", lang: "en", cert: "PG-13", keywords: ["superhero", "vigilante", "crime boss"] },
  { id: 157336, title: "Interstellar", date: "2014-11-05", poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", backdrop: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg", genres: [12, 18, 878], vote: 8.5, votes: 37000, runtime: 169, overview: "With Earth failing, a former pilot leads a mission through a wormhole in search of a new home for humanity.", cast: [[10297, "Cooper"]], directors: [525], companies: ["Paramount Pictures", "Syncopy"], country: "US", lang: "en", cert: "PG-13", keywords: ["space travel", "black hole", "time dilation"] },
  { id: 496243, title: "Parasite", date: "2019-05-30", poster: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop: "/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg", genres: [35, 53, 18], vote: 8.5, votes: 19000, runtime: 133, overview: "A struggling family schemes its way into the employ of a wealthy household, until a hidden secret upends everything.", cast: [[20738, "Kim Ki-taek"]], directors: [21684], companies: ["Barunson E&A"], country: "KR", lang: "ko", cert: "R", keywords: ["class differences", "con artist", "dark comedy"] },
  { id: 278, title: "The Shawshank Redemption", date: "1994-09-23", poster: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", backdrop: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", genres: [18, 80], vote: 8.7, votes: 28000, runtime: 142, overview: "A banker sentenced to life in prison forms an unlikely friendship and quietly refuses to give up hope.", cast: [[504, "Andy Dufresne"], [192, "Ellis 'Red' Redding"]], directors: [4027], companies: ["Castle Rock Entertainment"], country: "US", lang: "en", cert: "R", keywords: ["prison", "friendship", "escape"] },
  { id: 238, title: "The Godfather", date: "1972-03-14", poster: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", backdrop: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg", genres: [18, 80], vote: 8.7, votes: 21000, runtime: 175, overview: "The aging head of a crime family hands the business to a reluctant son who proves more ruthless than anyone expected.", cast: [[3084, "Don Vito Corleone"], [1158, "Michael Corleone"]], directors: [1776], companies: ["Paramount Pictures"], country: "US", lang: "en", cert: "R", keywords: ["mafia", "family", "power"] },
  { id: 680, title: "Pulp Fiction", date: "1994-09-10", poster: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", backdrop: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg", genres: [53, 80], vote: 8.5, votes: 28000, runtime: 154, overview: "Hitmen, a boxer and a gangster's wife cross paths in a set of interlocking Los Angeles crime stories.", cast: [[8891, "Vincent Vega"], [2231, "Jules Winnfield"]], directors: [138], companies: ["Miramax"], country: "US", lang: "en", cert: "R", keywords: ["nonlinear timeline", "hitman", "los angeles"] },
  { id: 603, title: "The Matrix", date: "1999-03-30", poster: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", backdrop: "/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg", genres: [28, 878], vote: 8.2, votes: 26000, runtime: 136, overview: "A hacker learns the world he knows is a simulation and joins a rebellion against the machines that built it.", cast: [[6384, "Neo"]], directors: [9340], companies: ["Warner Bros. Pictures", "Village Roadshow Pictures"], country: "US", lang: "en", cert: "R", keywords: ["simulated reality", "chosen one", "cyberpunk"] },
  { id: 13, title: "Forrest Gump", date: "1994-06-23", poster: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", backdrop: "/qdIMHd4sEfJSckfVJfKQvisL02a.jpg", genres: [35, 18, 10749], vote: 8.5, votes: 27000, runtime: 142, overview: "A kind-hearted man drifts through decades of American history while never losing sight of the woman he loves.", cast: [[31, "Forrest Gump"]], directors: [24], companies: ["Paramount Pictures"], country: "US", lang: "en", cert: "PG-13", keywords: ["historical events", "running", "vietnam war"] },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring", date: "2001-12-18", poster: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", backdrop: "/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg", genres: [12, 14, 28], vote: 8.4, votes: 25000, runtime: 179, overview: "A young hobbit sets out with an unlikely band of companions to destroy a ring of terrible power.", cast: [[109, "Frodo Baggins"]], directors: [108], companies: ["New Line Cinema", "WingNut Films"], country: "NZ", lang: "en", cert: "PG-13", keywords: ["quest", "magic ring", "epic"] },
  { id: 129, title: "Spirited Away", date: "2001-07-20", poster: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", backdrop: "/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg", genres: [16, 10751, 14], vote: 8.5, votes: 16000, runtime: 125, overview: "A girl wanders into a world of spirits and must work in a bathhouse for the gods to free her parents.", cast: [[19587, "Chihiro Ogino (voice)"]], directors: [608], companies: ["Studio Ghibli"], country: "JP", lang: "ja", cert: "PG", keywords: ["spirit world", "bathhouse", "coming of age"] },
  { id: 872585, title: "Oppenheimer", date: "2023-07-19", poster: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdrop: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", genres: [18, 36], vote: 8.1, votes: 9800, runtime: 181, overview: "The story of the physicist who led the race to build the atomic bomb, and the reckoning that followed.", cast: [[2037, "J. Robert Oppenheimer"]], directors: [525], companies: ["Universal Pictures", "Syncopy"], country: "US", lang: "en", cert: "R", keywords: ["biography", "atomic bomb", "physicist"] },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse", date: "2018-12-06", poster: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", backdrop: "/qGQf2OHIkoh89K8XeKQzhxczf96.jpg", genres: [16, 28, 12, 878], vote: 8.4, votes: 15000, runtime: 117, overview: "A Brooklyn teen gains spider powers and meets heroes from other dimensions who share his mantle.", cast: [[587506, "Miles Morales (voice)"]], directors: [], companies: ["Sony Pictures Animation"], country: "US", lang: "en", cert: "PG", collection: 573436, keywords: ["multiverse", "superhero", "animation"] },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse", date: "2023-05-31", poster: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdrop: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", genres: [16, 28, 12, 878], vote: 8.3, votes: 7400, runtime: 140, overview: "Miles is swept across the multiverse and clashes with a society of Spider-People over what a hero must sacrifice.", cast: [[587506, "Miles Morales (voice)"]], directors: [], companies: ["Sony Pictures Animation"], country: "US", lang: "en", cert: "PG", collection: 573436, keywords: ["multiverse", "superhero", "sequel"] },
  { id: 438631, title: "Dune", date: "2021-09-15", poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", backdrop: "/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg", genres: [878, 12], vote: 7.8, votes: 13000, runtime: 155, overview: "The heir of a noble house is thrust into a deadly struggle over a desert planet and its priceless spice.", cast: [[1190668, "Paul Atreides"], [505710, "Chani"]], directors: [137427], companies: ["Legendary Pictures"], country: "US", lang: "en", cert: "PG-13", collection: 726871, keywords: ["desert planet", "prophecy", "based on novel"] },
  { id: 693134, title: "Dune: Part Two", date: "2024-02-27", poster: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", backdrop: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", genres: [878, 12], vote: 8.1, votes: 7000, runtime: 167, overview: "Paul joins the desert people and seeks revenge on those who destroyed his family, while dreading the future he foresees.", cast: [[1190668, "Paul Atreides"], [505710, "Chani"]], directors: [137427], companies: ["Legendary Pictures"], country: "US", lang: "en", cert: "PG-13", collection: 726871, keywords: ["desert planet", "revenge", "sequel"] },
  { id: 299534, title: "Avengers: Endgame", date: "2019-04-24", poster: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", backdrop: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", genres: [12, 878, 28], vote: 8.2, votes: 26000, runtime: 181, overview: "The surviving heroes regroup for one last attempt to undo a catastrophe that wiped out half of all life.", cast: [[3223, "Tony Stark"]], directors: [19271], companies: ["Marvel Studios"], country: "US", lang: "en", cert: "PG-13", keywords: ["superhero", "time travel", "ensemble"] },
  { id: 346698, title: "Barbie", date: "2023-07-19", poster: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", backdrop: "/nHf61UzkfFno5X1ofIhugCPus2R.jpg", genres: [35, 12], vote: 7.0, votes: 9000, runtime: 114, overview: "A doll living in a perfect pastel world starts having very imperfect thoughts and heads to the real world for answers.", cast: [[234352, "Barbie"]], directors: [45400], companies: ["Warner Bros. Pictures", "Heyday Films"], country: "US", lang: "en", cert: "PG-13", keywords: ["doll", "satire", "self-discovery"] },
  { id: 545611, title: "Everything Everywhere All at Once", date: "2022-03-24", poster: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", backdrop: "/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg", genres: [28, 12, 878], vote: 7.8, votes: 6500, runtime: 140, overview: "A laundromat owner in the middle of a tax audit discovers she can tap into the lives of her other selves.", cast: [[1620, "Evelyn Quan Wang"]], directors: [1383612], companies: ["A24"], country: "US", lang: "en", cert: "R", keywords: ["multiverse", "mother daughter relationship", "martial arts"] },
  { id: 671, title: "Harry Potter and the Philosopher's Stone", date: "2001-11-16", poster: "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", backdrop: "/hziiv14OpD73u9gAak4XDDfBKa2.jpg", genres: [12, 14], vote: 7.9, votes: 27000, runtime: 152, overview: "An orphaned boy learns on his eleventh birthday that he is a wizard, and heads off to a school of magic.", cast: [[10980, "Harry Potter"]], directors: [10965], companies: ["Warner Bros. Pictures", "Heyday Films"], country: "GB", lang: "en", cert: "PG", keywords: ["wizard", "boarding school", "magic"] },
  { id: 11, title: "Star Wars", date: "1977-05-25", poster: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", backdrop: "/2w4xG178RpB4MDAIfTkqAuSJzec.jpg", genres: [12, 28, 878], vote: 8.2, votes: 20000, runtime: 121, overview: "A farm boy joins a smuggler, a princess and an old knight to take on a galactic empire.", cast: [[2, "Luke Skywalker"]], directors: [1], companies: ["Lucasfilm Ltd."], country: "US", lang: "en", cert: "PG", keywords: ["space opera", "rebellion", "hero's journey"] },
  { id: 19995, title: "Avatar", date: "2009-12-15", poster: "/kyeqWdyUXW608qlYkRqosgbbJyK.jpg", backdrop: "/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg", genres: [28, 12, 14, 878], vote: 7.6, votes: 31000, runtime: 162, overview: "A paraplegic marine is sent to an alien moon and finds himself torn between his orders and the people he comes to love.", cast: [[65731, "Jake Sully"]], directors: [2710], companies: ["20th Century Fox", "Lightstorm Entertainment"], country: "US", lang: "en", cert: "PG-13", keywords: ["alien planet", "colonialism", "3d"] },
];

type TvFixture = {
  id: number;
  name: string;
  date: string;
  poster: string;
  backdrop: string | null;
  genres: number[];
  vote: number;
  votes: number;
  seasons: number[];
  runtime: number;
  status: "Ended" | "Returning Series" | "Canceled";
  type: string;
  network: string;
  overview: string;
  cast: [number, string][];
  creators: number[];
  country: string;
  lang: string;
  cert: string;
  keywords: string[];
};

const SHOWS: TvFixture[] = [
  { id: 1396, name: "Breaking Bad", date: "2008-01-20", poster: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", backdrop: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg", genres: [18, 80], vote: 8.9, votes: 15000, seasons: [7, 13, 13, 13, 16], runtime: 47, status: "Ended", type: "Scripted", network: "AMC", overview: "A mild-mannered chemistry teacher with a terminal diagnosis turns to cooking meth to secure his family's future.", cast: [[17419, "Walter White"], [84497, "Jesse Pinkman"]], creators: [66633], country: "US", lang: "en", cert: "TV-MA", keywords: ["drug trade", "chemistry teacher", "moral decline"] },
  { id: 1399, name: "Game of Thrones", date: "2011-04-17", poster: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", backdrop: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg", genres: [10765, 18, 10759], vote: 8.5, votes: 25000, seasons: [10, 10, 10, 10, 10, 10, 7, 6], runtime: 60, status: "Ended", type: "Scripted", network: "HBO", overview: "Noble houses scheme and war for control of a continent while an ancient threat gathers beyond the northern wall.", cast: [[1223786, "Daenerys Targaryen"], [239019, "Jon Snow"]], creators: [9813], country: "US", lang: "en", cert: "TV-MA", keywords: ["dragon", "political intrigue", "based on novel"] },
  { id: 66732, name: "Stranger Things", date: "2016-07-15", poster: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", backdrop: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", genres: [18, 10765, 9648], vote: 8.6, votes: 18000, seasons: [8, 9, 8, 9, 8], runtime: 60, status: "Ended", type: "Scripted", network: "Netflix", overview: "When a boy vanishes in a small 1980s town, his friends uncover secret experiments and a terrifying parallel world.", cast: [[1356210, "Eleven"]], creators: [1179419], country: "US", lang: "en", cert: "TV-14", keywords: ["1980s", "supernatural", "small town"] },
  { id: 1668, name: "Friends", date: "1994-09-22", poster: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg", backdrop: "/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg", genres: [35], vote: 8.4, votes: 8000, seasons: [24, 24, 25, 24, 24, 25, 24, 24, 24, 18], runtime: 22, status: "Ended", type: "Scripted", network: "NBC", overview: "Six friends navigate careers, romance and coffee in Manhattan.", cast: [[4491, "Rachel Green"]], creators: [], country: "US", lang: "en", cert: "TV-PG", keywords: ["sitcom", "new york city", "friendship"] },
  { id: 60625, name: "Rick and Morty", date: "2013-12-02", poster: "/gdIrmf2DdY5mgN6ycVP0XlzKzbE.jpg", backdrop: "/eV3XnUul4UfIivz3kxgeIozeo50.jpg", genres: [16, 35, 10765, 10759], vote: 8.7, votes: 10000, seasons: [11, 10, 10, 10, 10, 10, 10, 10], runtime: 22, status: "Returning Series", type: "Scripted", network: "Adult Swim", overview: "A chaotic scientist drags his anxious grandson on dangerous adventures across dimensions.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["adult animation", "multiverse", "mad scientist"] },
  { id: 94605, name: "Arcane", date: "2021-11-06", poster: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg", backdrop: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg", genres: [16, 10765, 10759, 18], vote: 8.7, votes: 4500, seasons: [9, 9], runtime: 40, status: "Ended", type: "Scripted", network: "Netflix", overview: "Two sisters end up on opposite sides of a conflict between a gleaming city and the undercity beneath it.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-14", keywords: ["sisters", "steampunk", "based on video game"] },
  { id: 100088, name: "The Last of Us", date: "2023-01-15", poster: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", backdrop: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", genres: [18], vote: 8.6, votes: 5500, seasons: [9, 7], runtime: 55, status: "Returning Series", type: "Scripted", network: "HBO", overview: "Years after a fungal outbreak, a hardened survivor escorts a teenage girl across a ruined America.", cast: [[1253360, "Joel Miller"]], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["post-apocalyptic", "survival", "based on video game"] },
  { id: 95396, name: "Severance", date: "2022-02-18", poster: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", backdrop: "/npD65vPa4vvn1ZHpp3o05A5vdKT.jpg", genres: [18, 9648, 10765], vote: 8.4, votes: 2500, seasons: [9, 10], runtime: 50, status: "Returning Series", type: "Scripted", network: "Apple TV+", overview: "Office workers whose memories are surgically split between work and home begin to question what their employer is hiding.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["workplace", "memory", "corporate conspiracy"] },
  { id: 1398, name: "The Sopranos", date: "1999-01-10", poster: "/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg", backdrop: "/lNpkvX2s8LGB0mjGODMT4o6Up7j.jpg", genres: [18, 80], vote: 8.6, votes: 3000, seasons: [13, 13, 13, 13, 13, 21], runtime: 55, status: "Ended", type: "Scripted", network: "HBO", overview: "A New Jersey mob boss balances family, crime and therapy sessions he'd rather nobody knew about.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["mafia", "therapy", "new jersey"] },
  { id: 1438, name: "The Wire", date: "2002-06-02", poster: "/4lbclFySvugI51fwsyxBTOm4DqK.jpg", backdrop: "/oggnxmvofLtGQvXsO9bAFyCj3p6.jpg", genres: [80, 18], vote: 8.6, votes: 2500, seasons: [13, 12, 12, 13, 10], runtime: 60, status: "Ended", type: "Scripted", network: "HBO", overview: "Baltimore's drug trade, police, schools and press are examined season by season.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["baltimore", "police", "institutions"] },
  { id: 2316, name: "The Office", date: "2005-03-24", poster: "/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg", backdrop: "/vNpuAxGTl9HsUbHqam3E9CzqCvX.jpg", genres: [35], vote: 8.6, votes: 4500, seasons: [6, 22, 25, 19, 28, 26, 26, 24, 25], runtime: 22, status: "Ended", type: "Scripted", network: "NBC", overview: "A mockumentary crew follows the employees of a paper company branch and their painfully awkward boss.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-14", keywords: ["mockumentary", "workplace comedy", "paper company"] },
  { id: 136315, name: "The Bear", date: "2022-06-23", poster: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", backdrop: null, genres: [18, 35], vote: 8.1, votes: 1300, seasons: [8, 10, 10, 10], runtime: 30, status: "Returning Series", type: "Scripted", network: "FX", overview: "A fine-dining chef returns to Chicago to run his late brother's chaotic sandwich shop.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["restaurant", "chef", "grief"] },
  { id: 76479, name: "The Boys", date: "2019-07-25", poster: "/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg", backdrop: "/7Ns6tO3aYjppI5bFhyYZurOYGBT.jpg", genres: [10765, 10759], vote: 8.5, votes: 10000, seasons: [8, 8, 8, 8], runtime: 60, status: "Returning Series", type: "Scripted", network: "Prime Video", overview: "A group of vigilantes sets out to expose corporate-backed superheroes who abuse their powers.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["superhero", "satire", "corporate greed"] },
  { id: 87108, name: "Chernobyl", date: "2019-05-06", poster: "/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg", backdrop: null, genres: [18, 36], vote: 8.7, votes: 6000, seasons: [5], runtime: 65, status: "Ended", type: "Miniseries", network: "HBO", overview: "A dramatization of the 1986 nuclear disaster and the people who tried to contain it.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["nuclear disaster", "soviet union", "based on true story"] },
  { id: 71912, name: "The Witcher", date: "2019-12-20", poster: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", backdrop: "/jBJWaqoSCiARWtfV0GlqHrcdidd.jpg", genres: [10765, 18, 10759], vote: 8.0, votes: 5500, seasons: [8, 8, 8], runtime: 60, status: "Returning Series", type: "Scripted", network: "Netflix", overview: "A solitary monster hunter struggles to find his place in a world where people are often worse than beasts.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-MA", keywords: ["monster hunter", "sorcery", "based on novel"] },
  { id: 93405, name: "Squid Game", date: "2021-09-17", poster: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", backdrop: "/qw3J9cNeLioOLoR68WX7z79aCdK.jpg", genres: [10759, 9648, 18], vote: 7.8, votes: 15000, seasons: [9, 7, 6], runtime: 55, status: "Ended", type: "Scripted", network: "Netflix", overview: "Hundreds of people drowning in debt compete in deadly children's games for a life-changing prize.", cast: [], creators: [], country: "KR", lang: "ko", cert: "TV-MA", keywords: ["survival game", "debt", "death game"] },
  { id: 84958, name: "Loki", date: "2021-06-09", poster: "/voHUmluYmKyleFkTu3lOXQG702u.jpg", backdrop: null, genres: [18, 10765], vote: 8.2, votes: 11000, seasons: [6, 6], runtime: 50, status: "Ended", type: "Scripted", network: "Disney+", overview: "The god of mischief is recruited by a bureaucratic agency that polices the timeline.", cast: [], creators: [], country: "US", lang: "en", cert: "TV-14", keywords: ["time travel", "superhero", "alternate timeline"] },
];

const COLLECTIONS: Record<number, { name: string; poster: string | null; backdrop: string | null }> = {
  573436: { name: "Spider-Verse Collection", poster: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", backdrop: null },
  726871: { name: "Dune Collection", poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", backdrop: null },
};

/* ------------------------------------------------------------------------- */

function popularity(vote: number, votes: number, date: string): number {
  const age = Math.max(1, new Date().getFullYear() - Number(date.slice(0, 4)));
  return Math.round((vote * Math.log10(votes) * 40) / Math.sqrt(age)) / 10;
}

function movieItem(m: MovieFixture): TmdbMovieListItem {
  return {
    media_type: "movie",
    id: m.id,
    title: m.title,
    original_title: m.title,
    poster_path: m.poster,
    backdrop_path: m.backdrop,
    release_date: m.date,
    genre_ids: m.genres,
    vote_average: m.vote,
    vote_count: m.votes,
    popularity: popularity(m.vote, m.votes, m.date),
    overview: m.overview,
    original_language: m.lang,
  };
}

function tvItem(s: TvFixture): TmdbTvListItem {
  return {
    media_type: "tv",
    id: s.id,
    name: s.name,
    original_name: s.name,
    poster_path: s.poster,
    backdrop_path: s.backdrop,
    first_air_date: s.date,
    genre_ids: s.genres,
    vote_average: s.vote,
    vote_count: s.votes,
    popularity: popularity(s.vote, s.votes, s.date),
    overview: s.overview,
    original_language: s.lang,
    origin_country: [s.country],
  };
}

function page<T>(items: T[], pageParam: string | null, size = 20): TmdbPaged<T> {
  const p = Math.max(1, Number(pageParam) || 1);
  return {
    page: p,
    results: items.slice((p - 1) * size, p * size),
    total_pages: Math.max(1, Math.ceil(items.length / size)),
    total_results: items.length,
  };
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function seasonAirDate(show: TvFixture, season: number): string {
  const start = new Date(`${show.date}T00:00:00Z`);
  start.setUTCFullYear(start.getUTCFullYear() + (season - 1));
  return start.toISOString().slice(0, 10);
}

/** For returning series, the demo pretends the next episode airs in a few days. */
function nextEpisode(show: TvFixture) {
  if (show.status !== "Returning Series") return null;
  const season = show.seasons.length;
  const offset = (show.id % 6) + 1;
  return {
    name: `Episode ${show.seasons[season - 1] + 1}`,
    air_date: addDays(new Date(), offset),
    episode_number: show.seasons[season - 1] + 1,
    season_number: season,
    runtime: show.runtime,
  };
}

function sortBy<T>(items: T[], key: (x: T) => number | string, dir: "asc" | "desc") {
  return items.slice().sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const cmp = typeof ka === "number" && typeof kb === "number" ? ka - kb : String(ka).localeCompare(String(kb));
    return dir === "asc" ? cmp : -cmp;
  });
}

function discoverMovies(params: URLSearchParams) {
  let items = MOVIES.map(movieItem);
  const genres = params.get("with_genres")?.split(",").map(Number) ?? [];
  if (genres.length) items = items.filter((m) => genres.every((g) => m.genre_ids?.includes(g)));
  const year = params.get("primary_release_year");
  if (year) items = items.filter((m) => m.release_date?.startsWith(year));
  const country = params.get("with_origin_country");
  if (country) items = items.filter((m) => MOVIES.find((f) => f.id === m.id)?.country === country);
  const lang = params.get("with_original_language");
  if (lang) items = items.filter((m) => m.original_language === lang);
  return sortItems(items, params.get("sort_by") ?? "popularity.desc");
}

function discoverTv(params: URLSearchParams) {
  let items = SHOWS.map(tvItem);
  const genres = params.get("with_genres")?.split(",").map(Number) ?? [];
  if (genres.length) items = items.filter((m) => genres.every((g) => m.genre_ids?.includes(g)));
  const year = params.get("first_air_date_year");
  if (year) items = items.filter((m) => m.first_air_date?.startsWith(year));
  const type = params.get("with_type");
  if (type === "2") items = items.filter((m) => SHOWS.find((s) => s.id === m.id)?.type === "Miniseries");
  const status = params.get("with_status");
  if (status === "0") items = items.filter((m) => SHOWS.find((s) => s.id === m.id)?.status === "Returning Series");
  if (status === "3") items = items.filter((m) => SHOWS.find((s) => s.id === m.id)?.status === "Ended");
  const lang = params.get("with_original_language");
  if (lang) items = items.filter((m) => m.original_language === lang);
  return sortItems(items, params.get("sort_by") ?? "popularity.desc");
}

function sortItems<T extends TmdbMovieListItem | TmdbTvListItem>(items: T[], sort: string): T[] {
  const [field, dir] = sort.split(".") as [string, "asc" | "desc"];
  const date = (i: T) => ("release_date" in i ? i.release_date : (i as TmdbTvListItem).first_air_date) ?? "";
  const title = (i: T) => ("title" in i ? i.title : (i as TmdbTvListItem).name);
  switch (field) {
    case "vote_average":
      return sortBy(items, (i) => i.vote_average ?? 0, dir);
    case "vote_count":
      return sortBy(items, (i) => i.vote_count ?? 0, dir);
    case "primary_release_date":
    case "first_air_date":
      return sortBy(items, date, dir);
    case "title":
    case "name":
      return sortBy(items, title, dir);
    default:
      return sortBy(items, (i) => i.popularity ?? 0, dir);
  }
}

function matches(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

function movieDetails(m: MovieFixture): TmdbMovieDetails {
  const others = MOVIES.filter((o) => o.id !== m.id);
  const related = sortBy(others, (o) => o.genres.filter((g) => m.genres.includes(g)).length * 100 + o.vote, "desc");
  return {
    ...movieItem(m),
    overview: m.overview,
    tagline: "",
    genres: m.genres.map((id) => ({ id, name: MOVIE_GENRE_NAMES[id] ?? "Other" })),
    runtime: m.runtime,
    status: "Released",
    budget: 0,
    revenue: 0,
    homepage: null,
    imdb_id: null,
    production_companies: m.companies.map((name, i) => ({ id: i + 1, name, logo_path: null })),
    production_countries: [{ iso_3166_1: m.country, name: m.country }],
    spoken_languages: [{ iso_639_1: m.lang, english_name: LANGUAGE_NAMES[m.lang] ?? m.lang, name: "" }],
    belongs_to_collection: m.collection
      ? { id: m.collection, name: COLLECTIONS[m.collection].name, poster_path: COLLECTIONS[m.collection].poster, backdrop_path: null }
      : null,
    credits: {
      cast: m.cast.map(([pid, character], order) => ({
        id: pid,
        name: personById.get(pid)?.name ?? "Unknown",
        character,
        profile_path: personById.get(pid)?.profile ?? null,
        order,
      })),
      crew: m.directors.map((pid) => ({
        id: pid,
        name: personById.get(pid)?.name ?? "Unknown",
        job: "Director",
        department: "Directing",
        profile_path: personById.get(pid)?.profile ?? null,
      })),
    },
    videos: { results: [] },
    recommendations: page(related.slice(0, 8).map(movieItem), "1"),
    similar: page(related.slice(8, 14).map(movieItem), "1"),
    release_dates: { results: [{ iso_3166_1: "US", release_dates: [{ certification: m.cert, type: 3 }] }] },
    keywords: { keywords: m.keywords.map((name, id) => ({ id, name })) },
    external_ids: {},
    "watch/providers": { results: {} },
  };
}

function tvDetails(s: TvFixture): TmdbTvDetails {
  const others = SHOWS.filter((o) => o.id !== s.id);
  const related = sortBy(others, (o) => o.genres.filter((g) => s.genres.includes(g)).length * 100 + o.vote, "desc");
  const lastSeason = s.seasons.length;
  const next = nextEpisode(s);
  return {
    ...tvItem(s),
    overview: s.overview,
    tagline: "",
    genres: s.genres.map((id) => ({ id, name: TV_GENRE_NAMES[id] ?? "Other" })),
    episode_run_time: [s.runtime],
    number_of_episodes: s.seasons.reduce((a, b) => a + b, 0),
    number_of_seasons: s.seasons.length,
    seasons: s.seasons.map((count, i) => ({
      name: `Season ${i + 1}`,
      season_number: i + 1,
      episode_count: count,
      air_date: seasonAirDate(s, i + 1),
      poster_path: s.poster,
      overview: "",
    })),
    status: s.status,
    type: s.type,
    in_production: s.status === "Returning Series",
    last_air_date: addDays(new Date(`${seasonAirDate(s, lastSeason)}T00:00:00Z`), 7 * (s.seasons[lastSeason - 1] - 1)),
    networks: [{ id: 1, name: s.network, logo_path: null }],
    created_by: s.creators.map((pid) => ({ id: pid, name: personById.get(pid)?.name ?? "Unknown", profile_path: personById.get(pid)?.profile ?? null })),
    production_companies: [],
    origin_country: [s.country],
    spoken_languages: [{ iso_639_1: s.lang, english_name: LANGUAGE_NAMES[s.lang] ?? s.lang, name: "" }],
    next_episode_to_air: next,
    last_episode_to_air: {
      name: `Episode ${s.seasons[lastSeason - 1]}`,
      air_date: null,
      episode_number: s.seasons[lastSeason - 1],
      season_number: lastSeason,
      runtime: s.runtime,
    },
    aggregate_credits: {
      cast: s.cast.map(([pid, character], order) => ({
        id: pid,
        name: personById.get(pid)?.name ?? "Unknown",
        profile_path: personById.get(pid)?.profile ?? null,
        roles: [{ character, episode_count: s.seasons.reduce((a, b) => a + b, 0) }],
        total_episode_count: s.seasons.reduce((a, b) => a + b, 0),
        order,
      })),
      crew: s.creators.map((pid) => ({
        id: pid,
        name: personById.get(pid)?.name ?? "Unknown",
        profile_path: personById.get(pid)?.profile ?? null,
        department: "Production",
        jobs: [{ job: "Executive Producer", episode_count: s.seasons.reduce((a, b) => a + b, 0) }],
        total_episode_count: s.seasons.reduce((a, b) => a + b, 0),
      })),
    },
    videos: { results: [] },
    recommendations: page(related.slice(0, 8).map(tvItem), "1"),
    similar: page(related.slice(8, 14).map(tvItem), "1"),
    content_ratings: { results: [{ iso_3166_1: "US", rating: s.cert }] },
    keywords: { results: s.keywords.map((name, id) => ({ id, name })) },
    external_ids: {},
    "watch/providers": { results: {} },
  };
}

function seasonDetails(s: TvFixture, n: number): TmdbSeasonDetails | null {
  const count = s.seasons[n - 1];
  if (!count) return null;
  const start = new Date(`${seasonAirDate(s, n)}T00:00:00Z`);
  const next = nextEpisode(s);
  return {
    name: `Season ${n}`,
    overview: "",
    air_date: seasonAirDate(s, n),
    poster_path: s.poster,
    season_number: n,
    episodes: Array.from({ length: count + (next && next.season_number === n ? 1 : 0) }, (_, i) => ({
      name: `Episode ${i + 1}`,
      air_date: next && next.season_number === n && i === count ? next.air_date : addDays(start, i * 7),
      episode_number: i + 1,
      season_number: n,
      runtime: s.runtime,
      overview: "",
      still_path: null,
      vote_average: Math.round((s.vote - 0.4 + ((i * 7) % 9) / 10) * 10) / 10,
    })),
  };
}

function personCredits(pid: number): { cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] } {
  const cast: TmdbPersonCredit[] = [];
  const crew: TmdbPersonCredit[] = [];
  for (const m of MOVIES) {
    const role = m.cast.find(([id]) => id === pid);
    const base = { ...movieItem(m), media_type: "movie" as const };
    if (role) cast.push({ ...base, character: role[1] });
    if (m.directors.includes(pid)) crew.push({ ...base, job: "Director", department: "Directing" });
  }
  for (const s of SHOWS) {
    const role = s.cast.find(([id]) => id === pid);
    const base = { ...tvItem(s), media_type: "tv" as const, episode_count: s.seasons.reduce((a, b) => a + b, 0) };
    if (role) cast.push({ ...base, character: role[1] });
    if (s.creators.includes(pid)) crew.push({ ...base, job: "Creator", department: "Writing" });
  }
  return { cast, crew };
}

const MOVIE_GENRE_NAMES: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western" };
const TV_GENRE_NAMES: Record<number, string> = { 10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western" };
const LANGUAGE_NAMES: Record<string, string> = { en: "English", ko: "Korean", ja: "Japanese" };

/** Routes a TMDB path to demo data. Returns null for "not found". */
export function mockTmdb(path: string, params: URLSearchParams): unknown {
  const parts = path.split("/").filter(Boolean);
  const pageParam = params.get("page");

  if (parts[0] === "trending") {
    const type = parts[1];
    const items =
      type === "movie"
        ? MOVIES.map(movieItem)
        : type === "tv"
          ? SHOWS.map(tvItem)
          : [...MOVIES.map(movieItem), ...SHOWS.map(tvItem)];
    // "Trending" favours recent titles in the demo.
    return page(sortBy(items, (i) => ("release_date" in i ? i.release_date : (i as TmdbTvListItem).first_air_date) ?? "", "desc"), pageParam);
  }

  if (parts[0] === "discover") {
    const results: (TmdbMovieListItem | TmdbTvListItem)[] = parts[1] === "movie" ? discoverMovies(params) : discoverTv(params);
    return page(results, pageParam);
  }

  if (parts[0] === "search") {
    const q = params.get("query") ?? "";
    const movies = MOVIES.filter((m) => matches(m.title, q)).map(movieItem);
    const shows = SHOWS.filter((s) => matches(s.name, q)).map(tvItem);
    const people = PEOPLE.filter((p) => matches(p.name, q)).map((p) => ({
      media_type: "person" as const,
      id: p.id,
      name: p.name,
      profile_path: p.profile,
      known_for_department: p.dept,
      known_for: [],
    }));
    if (parts[1] === "movie") return page(movies, pageParam);
    if (parts[1] === "tv") return page(shows, pageParam);
    if (parts[1] === "person") return page(people, pageParam);
    return page([...movies, ...shows, ...people], pageParam);
  }

  if (parts[0] === "person" && parts[1] === "popular") {
    return page(
      PEOPLE.filter((p) => p.profile).map((p) => ({ id: p.id, name: p.name, profile_path: p.profile, known_for_department: p.dept, known_for: [] })),
      pageParam,
    );
  }

  if (parts[0] === "person") {
    const p = personById.get(Number(parts[1]));
    if (!p) return null;
    const details: TmdbPersonDetails = {
      id: p.id,
      name: p.name,
      biography: p.bio,
      birthday: p.born ?? null,
      deathday: null,
      place_of_birth: p.place ?? null,
      profile_path: p.profile,
      known_for_department: p.dept,
      also_known_as: [],
      combined_credits: personCredits(p.id),
      external_ids: {},
    };
    return details;
  }

  if (parts[0] === "collection") {
    const c = COLLECTIONS[Number(parts[1])];
    if (!c) return null;
    const details: TmdbCollectionDetails = {
      id: Number(parts[1]),
      name: c.name,
      poster_path: c.poster,
      backdrop_path: c.backdrop,
      parts: MOVIES.filter((m) => m.collection === Number(parts[1])).map(movieItem),
    };
    return details;
  }

  if (parts[0] === "movie") {
    const list = parts[1];
    if (list === "popular") return page(sortItems(MOVIES.map(movieItem), "popularity.desc"), pageParam);
    if (list === "top_rated") return page(sortItems(MOVIES.map(movieItem), "vote_average.desc"), pageParam);
    if (list === "now_playing" || list === "upcoming")
      return page(sortItems(MOVIES.map(movieItem), "primary_release_date.desc").slice(0, 8), pageParam);
    const m = MOVIES.find((x) => x.id === Number(list));
    return m ? movieDetails(m) : null;
  }

  if (parts[0] === "tv") {
    const list = parts[1];
    if (list === "popular") return page(sortItems(SHOWS.map(tvItem), "popularity.desc"), pageParam);
    if (list === "top_rated") return page(sortItems(SHOWS.map(tvItem), "vote_average.desc"), pageParam);
    if (list === "on_the_air" || list === "airing_today")
      return page(SHOWS.filter((s) => s.status === "Returning Series").map(tvItem), pageParam);
    const s = SHOWS.find((x) => x.id === Number(list));
    if (!s) return null;
    if (parts[2] === "season") return seasonDetails(s, Number(parts[3]));
    return tvDetails(s);
  }

  return null;
}
