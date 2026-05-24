// Seed the songs library with public-domain hymns.
// Run: node scripts/seed-songs.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2];
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const songs = [
  {
    title: "Amazing Grace",
    artist: "John Newton (1779)",
    original_key: "G",
    bpm: 70,
    tags: ["hymn", "public-domain", "communion"],
    reference_url: "https://www.youtube.com/watch?v=CDdvReNKKuk",
    chordpro_body: `{title: Amazing Grace}
{key: G}

{comment: Verse 1}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see

{comment: Verse 2}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved

{comment: Verse 3}
Through [G]many [G7]dangers, [C]toils and [G]snares
I [G]have al[Em]ready [D]come
'Tis [G]grace hath [G7]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home

{comment: Verse 4}
When [G]we've been [G7]there ten [C]thousand [G]years
Bright [G]shining [Em]as the [D]sun
We've [G]no less [G7]days to [C]sing God's [G]praise
Than [Em]when we'd [D]first be[G]gun
`,
  },
  {
    title: "Doxology (Praise God From Whom All Blessings Flow)",
    artist: "Thomas Ken (1709)",
    original_key: "C",
    bpm: 60,
    tags: ["hymn", "public-domain", "benediction"],
    chordpro_body: `{title: Doxology}
{key: C}

[C]Praise God from [F]whom all [C]blessings [G]flow
[C]Praise Him all [F]creatures [C]here be[G]low
[C]Praise Him [F]above ye [C]heavenly [Am]host
[C]Praise Father, [F]Son, and [G]Holy [C]Ghost
A[F]men
`,
  },
  {
    title: "Holy, Holy, Holy",
    artist: "Reginald Heber (1826)",
    original_key: "D",
    bpm: 80,
    tags: ["hymn", "public-domain", "opening"],
    chordpro_body: `{title: Holy, Holy, Holy}
{key: D}

{comment: Verse 1}
[D]Holy, holy, holy! Lord God Al[A]mighty!
[Em]Early in the [A]morning our [D]song shall rise to Thee
[D]Holy, holy, holy, merciful and [A]mighty
[D]God in three [G]Persons, [D]blessed [A7]Tri[D]nity

{comment: Verse 2}
[D]Holy, holy, holy! All the saints a[A]dore Thee
[Em]Casting down their [A]golden crowns a[D]round the glassy sea
[D]Cherubim and seraphim falling down be[A]fore Thee
[D]Which wert and [G]art and [D]ever[A7]more shalt [D]be

{comment: Verse 3}
[D]Holy, holy, holy! Lord God Al[A]mighty!
[Em]All Thy works shall [A]praise Thy name in [D]earth and sky and sea
[D]Holy, holy, holy, merciful and [A]mighty
[D]God in three [G]Persons, [D]blessed [A7]Tri[D]nity
`,
  },
  {
    title: "Be Thou My Vision",
    artist: "Traditional Irish (8th century)",
    original_key: "D",
    bpm: 72,
    tags: ["hymn", "public-domain", "worship"],
    chordpro_body: `{title: Be Thou My Vision}
{key: D}

{comment: Verse 1}
Be [D]Thou my [G]vision, O [Em]Lord of my [A]heart
[D]Naught be all [G]else to me, [Em]save that Thou [A]art
[D]Thou my best [G]thought, by [Em]day or by [A]night
[D]Waking or [G]sleeping, Thy [Em]presence my [A]light

{comment: Verse 2}
Be [D]Thou my [G]wisdom and [Em]Thou my true [A]Word
[D]I ever with [G]Thee and [Em]Thou with me [A]Lord
[D]Thou my great [G]Father, [Em]I Thy true [A]son
[D]Thou in me [G]dwelling and [Em]I with Thee [A]one

{comment: Verse 3}
[D]High King of [G]Heaven, my [Em]victory [A]won
May [D]I reach Heaven's [G]joys, O bright [Em]Heaven's [A]Sun
[D]Heart of my [G]own heart, what[Em]ever be[A]fall
[D]Still be my [G]Vision, O [Em]Ruler of [A]all
`,
  },
  {
    title: "It Is Well With My Soul",
    artist: "Horatio Spafford (1873)",
    original_key: "C",
    bpm: 68,
    tags: ["hymn", "public-domain", "communion"],
    chordpro_body: `{title: It Is Well With My Soul}
{key: C}

{comment: Verse 1}
When [C]peace like a [F]river at[C]tendeth my [G]way
When [C]sorrows like [F]sea billows [G]roll
What[C]ever my [F]lot, Thou hast [C]taught me to [Am]say
It is [F]well, it is [C/G] [G]well with my [C]soul

{comment: Chorus}
It is [F]well [C](it is well)
With my [G]soul (with my [C]soul)
It is [F]well, it is [C/G] [G]well with my [C]soul

{comment: Verse 2}
Tho' [C]Satan should [F]buffet, tho' [C]trials should [G]come
Let [C]this blest as[F]surance con[G]trol
That [C]Christ has re[F]garded my [C]helpless es[Am]tate
And hath [F]shed His own [C/G] [G]blood for my [C]soul

{comment: Verse 3}
And [C]Lord haste the [F]day when my [C]faith shall be [G]sight
The [C]clouds be rolled [F]back as a [G]scroll
The [C]trump shall re[F]sound and the [C]Lord shall des[Am]cend
Even [F]so, it is [C/G] [G]well with my [C]soul
`,
  },
  {
    title: "Come Thou Fount of Every Blessing",
    artist: "Robert Robinson (1758)",
    original_key: "D",
    bpm: 78,
    tags: ["hymn", "public-domain", "opening"],
    chordpro_body: `{title: Come Thou Fount of Every Blessing}
{key: D}

{comment: Verse 1}
[D]Come Thou Fount of [G]every [D]blessing
[D]Tune my heart to [G]sing Thy [A]grace
[D]Streams of mercy, [G]never [D]ceasing
[D]Call for songs of [A]loudest [D]praise
Teach me some me[A]lodious [Bm]sonnet
Sung by [G]flaming [A]tongues a[D]bove
[D]Praise the mount, I'm [G]fixed up[D]on it
[D]Mount of Thy re[A]deeming [D]love

{comment: Verse 2}
[D]Here I raise mine [G]Ebe[D]nezer
[D]Hither by Thy [G]help I'm [A]come
[D]And I hope, by [G]Thy good [D]pleasure
[D]Safely to a[A]rrive at [D]home
Jesus sought me [A]when a [Bm]stranger
Wandering [G]from the [A]fold of [D]God
[D]He, to rescue [G]me from [D]danger
[D]Interposed His [A]precious [D]blood

{comment: Verse 3}
[D]O to grace how [G]great a [D]debtor
[D]Daily I'm con[G]strained to [A]be
[D]Let Thy goodness, [G]like a [D]fetter
[D]Bind my wandering [A]heart to [D]Thee
Prone to wander, [A]Lord, I [Bm]feel it
Prone to [G]leave the [A]God I [D]love
[D]Here's my heart, Lord, [G]take and [D]seal it
[D]Seal it for Thy [A]courts a[D]bove
`,
  },
  {
    title: "Great Is Thy Faithfulness",
    artist: "Thomas Chisholm (1923)",
    original_key: "D",
    bpm: 76,
    tags: ["hymn", "public-domain", "communion"],
    chordpro_body: `{title: Great Is Thy Faithfulness}
{key: D}

{comment: Verse 1}
[D]Great is Thy [G]faithfulness, [D]O God my [F#m]Father
[Bm]There is no [E]shadow of [A]turning with [A7]Thee
[D]Thou changest [G]not, Thy com[D]passions, they [F#m]fail not
[Bm]As Thou hast [E]been Thou for [A]ever wilt [D]be

{comment: Chorus}
[D]Great is Thy [G]faithfulness! [D]Great is Thy [G]faithfulness!
[Em]Morning by [F#m]morning new [G]mercies I [A]see
[D]All I have [G]needed Thy [D]hand hath pro[F#m]vided
[Bm]Great is Thy [E]faithfulness, [A]Lord, unto [D]me

{comment: Verse 2}
[D]Summer and [G]winter, and [D]springtime and [F#m]harvest
[Bm]Sun, moon, and [E]stars in their [A]courses a[A7]bove
[D]Join with all [G]nature in [D]manifold [F#m]witness
[Bm]To Thy great [E]faithfulness, [A]mercy, and [D]love

{comment: Verse 3}
[D]Pardon for [G]sin and a [D]peace that en[F#m]dureth
[Bm]Thine own dear [E]presence to [A]cheer and to [A7]guide
[D]Strength for to[G]day and bright [D]hope for to[F#m]morrow
[Bm]Blessings all [E]mine, with ten [A]thousand be[D]side
`,
  },
  {
    title: "When I Survey the Wondrous Cross",
    artist: "Isaac Watts (1707)",
    original_key: "D",
    bpm: 66,
    tags: ["hymn", "public-domain", "good-friday", "communion"],
    chordpro_body: `{title: When I Survey the Wondrous Cross}
{key: D}

{comment: Verse 1}
[D]When I sur[G]vey the [D]wondrous [G]cross
[D]On which the [G]Prince of [A]glory [D]died
[D]My richest [G]gain I [D]count but [G]loss
And [D]pour con[G]tempt on [A]all my [D]pride

{comment: Verse 2}
For[D]bid it, [G]Lord, that [D]I should [G]boast
[D]Save in the [G]death of [A]Christ my [D]God
[D]All the vain [G]things that [D]charm me [G]most
I [D]sacri[G]fice them [A]to His [D]blood

{comment: Verse 3}
[D]See from His [G]head, His [D]hands, His [G]feet
[D]Sorrow and [G]love flow [A]mingled [D]down
[D]Did e'er such [G]love and [D]sorrow [G]meet
Or [D]thorns com[G]pose so [A]rich a [D]crown?

{comment: Verse 4}
Were [D]the whole [G]realm of [D]nature [G]mine
[D]That were a [G]present [A]far too [D]small
[D]Love so a[G]mazing, [D]so di[G]vine
De[D]mands my [G]soul, my [A]life, my [D]all
`,
  },
  {
    title: "Blessed Assurance",
    artist: "Fanny Crosby (1873)",
    original_key: "D",
    bpm: 90,
    tags: ["hymn", "public-domain", "praise"],
    chordpro_body: `{title: Blessed Assurance}
{key: D}

{comment: Verse 1}
[D]Blessed as[G]surance, [D]Jesus is [A]mine!
Oh, what a [D]foretaste of [G]glory di[A]vine!
[D]Heir of sal[G]vation, [D]purchase of [A]God
[D]Born of His [G]Spirit, [D]washed in His [A]blood

{comment: Chorus}
[D]This is my [A]story, [D]this is my [G]song
[D]Praising my [A]Savior [D]all the day [A]long
[D]This is my [A]story, [D]this is my [G]song
[D]Praising my [A]Savior, [D]all the day [A]long

{comment: Verse 2}
[D]Perfect sub[G]mission, [D]perfect de[A]light
[D]Visions of [G]rapture now [A]burst on my sight
[D]Angels de[G]scending, [D]bring from a[A]bove
[D]Echoes of [G]mercy, [D]whispers of [A]love

{comment: Verse 3}
[D]Perfect sub[G]mission, [D]all is at [A]rest
[D]I in my [G]Savior am [A]happy and blest
[D]Watching and [G]waiting, [D]looking a[A]bove
[D]Filled with His [G]goodness, [D]lost in His [A]love
`,
  },
  {
    title: "Nothing But the Blood",
    artist: "Robert Lowry (1876)",
    original_key: "G",
    bpm: 84,
    tags: ["hymn", "public-domain", "communion"],
    chordpro_body: `{title: Nothing But the Blood}
{key: G}

{comment: Verse 1}
[G]What can wash a[D]way my [G]sin?
[D]Nothing but the [G]blood of Jesus
What can make me [D]whole a[G]gain?
[D]Nothing but the [G]blood of Jesus

{comment: Chorus}
[G]O precious is the [D]flow
That makes me [G]white as snow
[C]No other [G]fount I know
[D]Nothing but the [G]blood of Jesus

{comment: Verse 2}
[G]For my pardon [D]this I [G]see
[D]Nothing but the [G]blood of Jesus
For my cleansing [D]this my [G]plea
[D]Nothing but the [G]blood of Jesus

{comment: Verse 3}
[G]Nothing can for [D]sin a[G]tone
[D]Nothing but the [G]blood of Jesus
Naught of good that [D]I have [G]done
[D]Nothing but the [G]blood of Jesus

{comment: Verse 4}
[G]This is all my [D]hope and [G]peace
[D]Nothing but the [G]blood of Jesus
This is all my [D]righteous[G]ness
[D]Nothing but the [G]blood of Jesus
`,
  },
  {
    title: "How Firm a Foundation",
    artist: "John Rippon's Selection (1787)",
    original_key: "G",
    bpm: 74,
    tags: ["hymn", "public-domain", "comfort"],
    chordpro_body: `{title: How Firm a Foundation}
{key: G}

{comment: Verse 1}
[G]How firm a foun[C]dation, ye [G]saints of the [D]Lord
Is [G]laid for your [C]faith in His [D]excellent [G]word!
What [G]more can He [C]say than to [G]you He hath [D]said
You who [G]unto the [C]Savior, who [G]unto the [D]Savior
Who [G]unto the [C]Savior for [G]refuge have [D]fled?

{comment: Verse 2}
[G]"Fear not, I am [C]with thee, O [G]be not dis[D]mayed
For [G]I am thy [C]God and will [D]still give thee [G]aid
I'll [G]strengthen thee, [C]help thee, and [G]cause thee to [D]stand
Up[G]held by My [C]righteous, up[G]held by My [D]righteous
Up[G]held by My [C]righteous, om[G]nipotent [D]hand."

{comment: Verse 3}
[G]"When through the deep [C]waters I [G]call thee to [D]go
The [G]rivers of [C]sorrow shall [D]not over[G]flow
For [G]I will be [C]with thee, thy [G]troubles to [D]bless
And [G]sanctify [C]to thee, and [G]sanctify [D]to thee
And [G]sanctify [C]to thee thy [G]deepest dis[D]tress."

{comment: Verse 4}
[G]"The soul that on [C]Jesus hath [G]leaned for re[D]pose
I [G]will not, I [C]will not de[D]sert to its [G]foes
That [G]soul, though all [C]hell should en[G]deavor to [D]shake
I'll [G]never, no [C]never, I'll [G]never, no [C]never
I'll [G]never, no [C]never, no, [G]never for[D]sake!"
`,
  },
  {
    title: "I Surrender All",
    artist: "Judson Van DeVenter (1896)",
    original_key: "G",
    bpm: 72,
    tags: ["hymn", "public-domain", "consecration"],
    chordpro_body: `{title: I Surrender All}
{key: G}

{comment: Verse 1}
[G]All to Jesus [C]I sur[G]render
[D]All to Him I [G]freely give
[G]I will ever [C]love and [G]trust Him
[D]In His presence [G]daily live

{comment: Chorus}
I sur[D]render [G]all
I sur[D]render [G]all
[C]All to Thee, my [G]blessed [D]Savior
[G]I sur[D]render [G]all

{comment: Verse 2}
[G]All to Jesus [C]I sur[G]render
[D]Humbly at His [G]feet I bow
[G]Worldly pleasures [C]all for[G]saken
[D]Take me, Jesus, [G]take me now

{comment: Verse 3}
[G]All to Jesus [C]I sur[G]render
[D]Make me, Savior, [G]wholly Thine
[G]Let me feel Thy [C]Holy [G]Spirit
[D]Truly know that [G]Thou art mine

{comment: Verse 4}
[G]All to Jesus [C]I sur[G]render
[D]Lord, I give my[G]self to Thee
[G]Fill me with Thy [C]love and [G]power
[D]Let Thy blessing [G]fall on me
`,
  },
  {
    title: "The Old Rugged Cross",
    artist: "George Bennard (1913)",
    original_key: "G",
    bpm: 60,
    tags: ["hymn", "public-domain", "good-friday", "communion"],
    chordpro_body: `{title: The Old Rugged Cross}
{key: G}

{comment: Verse 1}
[G]On a hill far a[C]way stood an [G]old rugged cross
The [D]emblem of suffering and [G]shame
And I [G]love that old [C]cross where the [G]dearest and best
For a [Em]world of lost [D]sinners was [G]slain

{comment: Chorus}
So I'll [G]cherish the [C]old rugged [G]cross
Till my [D]trophies at last I lay [G]down
I will [G]cling to the [C]old rugged [G]cross
And ex[D]change it some day for a [G]crown

{comment: Verse 2}
[G]O the old rugged [C]cross, so de[G]spised by the world
Has a [D]wondrous attraction for [G]me
For the [G]dear Lamb of [C]God left His [G]glory above
To [Em]bear it to [D]dark Cal[G]vary

{comment: Verse 3}
[G]In the old rugged [C]cross, stained with [G]blood so divine
A [D]wondrous beauty I [G]see
For 'twas [G]on that old [C]cross Jesus [G]suffered and died
To [Em]pardon and [D]sanctify [G]me

{comment: Verse 4}
[G]To the old rugged [C]cross I will [G]ever be true
Its [D]shame and reproach gladly [G]bear
Then He'll [G]call me some [C]day to my [G]home far away
Where His [Em]glory for[D]ever I'll [G]share
`,
  },
  {
    title: "Crown Him With Many Crowns",
    artist: "Matthew Bridges (1851)",
    original_key: "D",
    bpm: 90,
    tags: ["hymn", "public-domain", "praise", "easter"],
    chordpro_body: `{title: Crown Him With Many Crowns}
{key: D}

{comment: Verse 1}
[D]Crown Him with [G]many [D]crowns
The [A]Lamb upon His [D]throne
Hark! [G]How the heavenly [D]anthem drowns
All [A]music but its [D]own
A[G]wake, my [D]soul, and [G]sing
Of [A]Him who died for [D]thee
And [G]hail Him as thy [D]matchless King
Through [A]all eter[D]nity

{comment: Verse 2}
[D]Crown Him the [G]Lord of [D]love
Be[A]hold His hands and [D]side
Rich [G]wounds, yet [D]visible a[G]bove
In [A]beauty glori[D]fied
No [G]angel in the [D]sky
Can [G]fully bear that [D]sight
But [G]downward bends his [D]wondering eye
At [A]mysteries so [D]bright

{comment: Verse 3}
[D]Crown Him the [G]Lord of [D]life
Who [A]triumphed o'er the [D]grave
And [G]rose victori[D]ous in the [G]strife
For [A]those He came to [D]save
His [G]glories now we [D]sing
Who [G]died and rose on [D]high
Who [G]died, eternal [D]life to bring
And [A]lives, that death may [D]die
`,
  },
  {
    title: "Joy to the World",
    artist: "Isaac Watts (1719)",
    original_key: "D",
    bpm: 95,
    tags: ["hymn", "public-domain", "christmas", "praise"],
    chordpro_body: `{title: Joy to the World}
{key: D}

{comment: Verse 1}
[D]Joy to the [A]world, the [D]Lord is come
Let [A]earth re[D]ceive her King
Let [D]every [A]heart pre[Bm]pare Him [F#m]room
And [G]heaven and [D]nature [A]sing
And [G]heaven and [D]nature [A]sing
And [D]heaven, and [G]heaven and [A]nature [D]sing

{comment: Verse 2}
[D]Joy to the [A]world, the [D]Savior reigns
Let [A]men their [D]songs employ
While [D]fields and [A]floods, [Bm]rocks, [F#m]hills, and plains
Re[G]peat the [D]sounding [A]joy
Re[G]peat the [D]sounding [A]joy
Re[D]peat, re[G]peat the [A]sounding [D]joy

{comment: Verse 3}
[D]He rules the [A]world with [D]truth and grace
And [A]makes the [D]nations prove
The [D]glories [A]of His [Bm]righteous[F#m]ness
And [G]wonders [D]of His [A]love
And [G]wonders [D]of His [A]love
And [D]wonders, [G]wonders [A]of His [D]love
`,
  },
  {
    title: "What a Friend We Have in Jesus",
    artist: "Joseph Scriven (1855)",
    original_key: "F",
    bpm: 68,
    tags: ["hymn", "public-domain", "prayer", "comfort"],
    chordpro_body: `{title: What a Friend We Have in Jesus}
{key: F}

{comment: Verse 1}
[F]What a friend we have in [Bb]Jesus
[Gm]All our sins and griefs to [F]bear
[F]What a privilege to [Bb]carry
[Gm]Everything to [C]God in [F]prayer
[F]O what peace we [Dm]often [Gm]forfeit
[F]O what needless [C]pain we [F]bear
[F]All because we [Dm]do not [Gm]carry
[F]Everything to [C]God in [F]prayer

{comment: Verse 2}
[F]Have we trials and tempta[Bb]tions
[Gm]Is there trouble [F]anywhere
[F]We should never be dis[Bb]couraged
[Gm]Take it to the [C]Lord in [F]prayer
[F]Can we find a [Dm]friend so [Gm]faithful
[F]Who will all our [C]sorrows [F]share
[F]Jesus knows our [Dm]every [Gm]weakness
[F]Take it to the [C]Lord in [F]prayer

{comment: Verse 3}
[F]Are we weak and heavy [Bb]laden
[Gm]Cumbered with a [F]load of care
[F]Precious Savior, still our [Bb]refuge
[Gm]Take it to the [C]Lord in [F]prayer
[F]Do thy friends de[Dm]spise, for[Gm]sake thee
[F]Take it to the [C]Lord in [F]prayer
[F]In His arms He'll [Dm]take and [Gm]shield thee
[F]Thou wilt find a [C]solace [F]there
`,
  },
  {
    title: "Rock of Ages",
    artist: "Augustus Toplady (1763)",
    original_key: "Eb",
    bpm: 70,
    tags: ["hymn", "public-domain", "communion"],
    chordpro_body: `{title: Rock of Ages}
{key: Eb}

{comment: Verse 1}
[Eb]Rock of Ages, [Bb]cleft for [Eb]me
Let me hide my[Bb]self in [Eb]Thee
Let the [Ab]water [Eb]and the [Bb]blood
From Thy [Ab]wounded [Eb]side which [Bb]flowed
Be of sin the [Eb]double [Ab]cure
[Eb]Save from [Bb]wrath and [Eb]make me pure

{comment: Verse 2}
[Eb]Not the labors [Bb]of my [Eb]hands
Can ful[Bb]fill Thy [Eb]law's demands
Could my [Ab]zeal no [Eb]respite [Bb]know
Could my [Ab]tears for[Eb]ever [Bb]flow
All for sin could [Eb]not a[Ab]tone
[Eb]Thou must [Bb]save, and [Eb]Thou alone

{comment: Verse 3}
[Eb]Nothing in my [Bb]hand I [Eb]bring
Simply [Bb]to Thy [Eb]cross I cling
Naked, [Ab]come to [Eb]Thee for [Bb]dress
Helpless, [Ab]look to [Eb]Thee for [Bb]grace
Foul, I to the [Eb]fountain [Ab]fly
[Eb]Wash me, [Bb]Savior, [Eb]or I die

{comment: Verse 4}
[Eb]While I draw this [Bb]fleeting [Eb]breath
When my [Bb]eyes shall [Eb]close in death
When I [Ab]rise to [Eb]worlds un[Bb]known
And be[Ab]hold Thee [Eb]on Thy [Bb]throne
Rock of Ages, [Eb]cleft for [Ab]me
[Eb]Let me [Bb]hide my[Eb]self in Thee
`,
  },
  {
    title: "Trust and Obey",
    artist: "John H. Sammis (1887)",
    original_key: "D",
    bpm: 100,
    tags: ["hymn", "public-domain", "consecration"],
    chordpro_body: `{title: Trust and Obey}
{key: D}

{comment: Verse 1}
When we [D]walk with the Lord in the [G]light of His [D]word
What a [G]glory He [D]sheds on our [A]way
While we [D]do His good will, He a[G]bides with us [D]still
And with [A]all who will [D]trust and o[A]bey

{comment: Chorus}
[D]Trust and o[G]bey, for there's [D]no other [A]way
To be [D]happy in [G]Jesus, but to [A]trust and o[D]bey

{comment: Verse 2}
Not a [D]shadow can rise, not a [G]cloud in the [D]skies
But His [G]smile quickly [D]drives it a[A]way
Not a [D]doubt or a fear, not a [G]sigh or a [D]tear
Can a[A]bide while we [D]trust and o[A]bey

{comment: Verse 3}
But we [D]never can prove the de[G]lights of His [D]love
Until [G]all on the [D]altar we [A]lay
For the [D]favor He shows, for the [G]joy He be[D]stows
Are for [A]them who will [D]trust and o[A]bey

{comment: Verse 4}
Then in [D]fellowship sweet we will [G]sit at His [D]feet
Or we'll [G]walk by His [D]side in the [A]way
What He [D]says we will do, where He [G]sends we will [D]go
Never [A]fear, only [D]trust and o[A]bey
`,
  },
  {
    title: "A Mighty Fortress Is Our God",
    artist: "Martin Luther (1529)",
    original_key: "D",
    bpm: 80,
    tags: ["hymn", "public-domain", "reformation"],
    chordpro_body: `{title: A Mighty Fortress Is Our God}
{key: D}

{comment: Verse 1}
A [D]mighty [G]fortress [D]is our [A]God
A [D]bulwark [G]never [D]fail-[A]ing
Our [D]helper [G]He, a-[A]mid the [Bm]flood
Of [G]mortal [A]ills pre-[D]vail-[A]ing
For [D]still our ancient [A]foe
Doth [D]seek to work us [A]woe
His [D]craft and [G]power are [D]great
And, [Bm]armed with cruel [A]hate
On [D]earth is [G]not his [A]equ-[D]al

{comment: Verse 2}
Did [D]we in [G]our own [D]strength con-[A]fide
Our [D]striving [G]would be [D]los-[A]ing
Were [D]not the [G]right Man [A]on our [Bm]side
The [G]Man of [A]God's own [D]choos-[A]ing
Dost [D]ask who that may [A]be?
[D]Christ Jesus, it is [A]He
Lord [D]Saba-[G]oth His [D]name
From [Bm]age to age the [A]same
And [D]He must [G]win the [A]bat-[D]tle

{comment: Verse 3}
And [D]though this [G]world, with [D]devils [A]filled
Should [D]threaten [G]to un-[D]do [A]us
We [D]will not [G]fear, for [A]God hath [Bm]willed
His [G]truth to [A]triumph [D]through [A]us
The [D]prince of darkness [A]grim
We [D]tremble not for [A]him
His [D]rage we [G]can en-[D]dure
For [Bm]lo, his doom is [A]sure
One [D]little [G]word shall [A]fell [D]him
`,
  },
  {
    title: "Praise to the Lord, the Almighty",
    artist: "Joachim Neander (1680)",
    original_key: "G",
    bpm: 90,
    tags: ["hymn", "public-domain", "praise"],
    chordpro_body: `{title: Praise to the Lord, the Almighty}
{key: G}

{comment: Verse 1}
[G]Praise to the [C]Lord, the Al-[G]mighty, the [D]King of cre-[G]ation
O my [G]soul, praise [C]Him, for [G]He is thy [D]health and sal-[G]vation
[D]All ye who [G]hear
[D]Now to His [G]temple draw [Em]near
[D]Join me in [C]glad ado-[G]ration

{comment: Verse 2}
[G]Praise to the [C]Lord, who o'er [G]all things so [D]wondrously [G]reigneth
[G]Shelters thee [C]under His [G]wings, yea, so [D]gently sus-[G]taineth
[D]Hast thou not [G]seen
[D]How thy desires [G]e'er have [Em]been
[D]Granted in [C]what He or-[G]daineth?

{comment: Verse 3}
[G]Praise to the [C]Lord, who doth [G]prosper thy [D]work and de-[G]fend thee
[G]Surely His [C]goodness and [G]mercy here [D]daily at-[G]tend thee
[D]Ponder a-[G]new
[D]What the Al-[G]mighty can [Em]do
If with His [D]love He be-[C]friend [G]thee

{comment: Verse 4}
[G]Praise to the [C]Lord, oh, let [G]all that is [D]in me a-[G]dore Him
[G]All that hath [C]life and breath, [G]come now with [D]praises be-[G]fore Him
[D]Let the A-[G]men
[D]Sound from His [G]people a-[Em]gain
[D]Gladly fore-[C]e'er we a-[G]dore Him
`,
  },
  {
    title: "All Hail the Power of Jesus' Name",
    artist: "Edward Perronet (1779)",
    original_key: "G",
    bpm: 84,
    tags: ["hymn", "public-domain", "praise"],
    chordpro_body: `{title: All Hail the Power of Jesus' Name}
{key: G}

{comment: Verse 1}
[G]All hail the [C]power of [G]Jesus' [D]name
Let [G]angels [D]prostrate [G]fall
Bring [C]forth the [G]royal [C]diadem
And [G]crown Him [D]Lord of [G]all
Bring [C]forth the [G]royal [C]diadem
And [G]crown Him [D]Lord of [G]all

{comment: Verse 2}
Ye [G]chosen [C]seed of [G]Israel's [D]race
Ye [G]ransomed [D]from the [G]fall
Hail [C]Him who [G]saves you [C]by His grace
And [G]crown Him [D]Lord of [G]all
Hail [C]Him who [G]saves you [C]by His grace
And [G]crown Him [D]Lord of [G]all

{comment: Verse 3}
Let [G]every [C]kindred, [G]every [D]tribe
On [G]this ter-[D]restrial [G]ball
To [C]Him all [G]majesty as-[C]cribe
And [G]crown Him [D]Lord of [G]all
To [C]Him all [G]majesty as-[C]cribe
And [G]crown Him [D]Lord of [G]all

{comment: Verse 4}
Oh, [G]that with [C]yonder [G]sacred [D]throng
We [G]at His [D]feet may [G]fall
We'll [C]join the [G]everlasting [C]song
And [G]crown Him [D]Lord of [G]all
We'll [C]join the [G]everlasting [C]song
And [G]crown Him [D]Lord of [G]all
`,
  },
  {
    title: "Christ the Lord Is Risen Today",
    artist: "Charles Wesley (1739)",
    original_key: "C",
    bpm: 96,
    tags: ["hymn", "public-domain", "easter"],
    chordpro_body: `{title: Christ the Lord Is Risen Today}
{key: C}

{comment: Verse 1}
[C]Christ the [F]Lord is [C]risen to-[G]day, Alle-[C]luia!
[C]Sons of [F]men and [C]angels [G]say, Alle-[C]luia!
[C]Raise your [F]joys and [C]triumphs [G]high, Alle-[C]luia!
[C]Sing, ye [F]heavens, and [C]earth re-[G]ply, Alle-[C]luia!

{comment: Verse 2}
[C]Love's re-[F]deeming [C]work is [G]done, Alle-[C]luia!
[C]Fought the [F]fight, the [C]battle [G]won, Alle-[C]luia!
[C]Death in [F]vain for-[C]bids Him [G]rise, Alle-[C]luia!
[C]Christ has [F]opened [C]paradise, Alle-[C]luia!

{comment: Verse 3}
[C]Lives a-[F]gain our [C]glorious [G]King, Alle-[C]luia!
[C]Where, O [F]death, is [C]now thy [G]sting? Alle-[C]luia!
[C]Once He [F]died our [C]souls to [G]save, Alle-[C]luia!
[C]Where thy [F]victory, O [C]grave? Alle-[C]luia!

{comment: Verse 4}
[C]Soar we [F]now where [C]Christ has [G]led, Alle-[C]luia!
[C]Following [F]our ex-[C]alted [G]Head, Alle-[C]luia!
[C]Made like [F]Him, like [C]Him we [G]rise, Alle-[C]luia!
[C]Ours the [F]cross, the [C]grave, the [G]skies, Alle-[C]luia!
`,
  },
  {
    title: "Just As I Am",
    artist: "Charlotte Elliott (1835)",
    original_key: "F",
    bpm: 72,
    tags: ["hymn", "public-domain", "invitation"],
    chordpro_body: `{title: Just As I Am}
{key: F}

{comment: Verse 1}
[F]Just as I [Bb]am, with-[F]out one [C]plea
But [F]that Thy blood was [Bb]shed for [F]me
And [F]that Thou bid'st me [Bb]come to [F]Thee
O [Bb]Lamb of [F]God, I [C]come, I [F]come

{comment: Verse 2}
[F]Just as I [Bb]am, and [F]waiting [C]not
To [F]rid my soul of [Bb]one dark [F]blot
To [F]Thee, whose blood can [Bb]cleanse each [F]spot
O [Bb]Lamb of [F]God, I [C]come, I [F]come

{comment: Verse 3}
[F]Just as I [Bb]am, though [F]tossed a-[C]bout
With [F]many a conflict, [Bb]many a [F]doubt
[F]Fightings within, and [Bb]fears with-[F]out
O [Bb]Lamb of [F]God, I [C]come, I [F]come

{comment: Verse 4}
[F]Just as I [Bb]am, poor, [F]wretched, [C]blind
[F]Sight, riches, [Bb]healing of the [F]mind
Yea, [F]all I need, in [Bb]Thee to [F]find
O [Bb]Lamb of [F]God, I [C]come, I [F]come

{comment: Verse 5}
[F]Just as I [Bb]am, Thou [F]wilt re-[C]ceive
Wilt [F]welcome, pardon, [Bb]cleanse, re-[F]lieve
Be-[F]cause Thy promise [Bb]I be-[F]lieve
O [Bb]Lamb of [F]God, I [C]come, I [F]come
`,
  },
  {
    title: "My Hope Is Built on Nothing Less (The Solid Rock)",
    artist: "Edward Mote (1834)",
    original_key: "D",
    bpm: 88,
    tags: ["hymn", "public-domain", "assurance"],
    chordpro_body: `{title: My Hope Is Built on Nothing Less}
{key: D}

{comment: Verse 1}
My [D]hope is [G]built on [D]nothing [A]less
Than [D]Jesus' [G]blood and [A]righteous-[D]ness
I [D]dare not [G]trust the [D]sweetest [A]frame
But [D]wholly [G]lean on [A]Jesus' [D]name

{comment: Chorus}
On [D]Christ, the [G]solid [D]Rock, I [A]stand
All [D]other [G]ground is [A]sinking [D]sand
All [D]other [G]ground is [A]sinking [D]sand

{comment: Verse 2}
When [D]darkness [G]veils His [D]lovely [A]face
I [D]rest on [G]His un-[A]changing [D]grace
In [D]every [G]high and [D]stormy [A]gale
My [D]anchor [G]holds with-[A]in the [D]veil

{comment: Verse 3}
His [D]oath, His [G]covenant, His [A]blood
Sup-[D]port me [G]in the [A]whelming [D]flood
When [D]all a-[G]round my [D]soul gives [A]way
He [D]then is [G]all my [A]hope and [D]stay

{comment: Verse 4}
When [D]He shall [G]come with [D]trumpet [A]sound
Oh, [D]may I [G]then in [A]Him be [D]found
Dressed [D]in His [G]righteous-[D]ness a-[A]lone
Fault-[D]less to [G]stand be-[A]fore the [D]throne
`,
  },
  {
    title: "I Need Thee Every Hour",
    artist: "Annie S. Hawks (1872)",
    original_key: "G",
    bpm: 70,
    tags: ["hymn", "public-domain", "prayer"],
    chordpro_body: `{title: I Need Thee Every Hour}
{key: G}

{comment: Verse 1}
I [G]need Thee every [C]hour
Most [G]gracious [D]Lord
No [G]tender voice like [C]Thine
Can [G]peace af-[D]ford

{comment: Chorus}
I [G]need Thee, [D]O I [G]need Thee
[G]Every hour I [D]need Thee
O [G]bless me [C]now, my [G]Savior
I [G]come to [D]Thee

{comment: Verse 2}
I [G]need Thee every [C]hour
[G]Stay Thou [D]near by
[G]Temptations lose their [C]power
When [G]Thou art [D]nigh

{comment: Verse 3}
I [G]need Thee every [C]hour
In [G]joy or [D]pain
[G]Come quickly and a-[C]bide
Or [G]life is [D]vain

{comment: Verse 4}
I [G]need Thee every [C]hour
Most [G]Holy [D]One
O [G]make me Thine in-[C]deed
Thou [G]blessed [D]Son
`,
  },
  {
    title: "Sweet Hour of Prayer",
    artist: "William Walford (1845)",
    original_key: "D",
    bpm: 75,
    tags: ["hymn", "public-domain", "prayer"],
    chordpro_body: `{title: Sweet Hour of Prayer}
{key: D}

{comment: Verse 1}
[D]Sweet hour of [G]prayer, sweet [D]hour of [A]prayer
That [D]calls me from a [G]world of [A]care
And [D]bids me at my [G]Father's [D]throne
Make [D]all my wants and [G]wishes [A]known
In [D]seasons of dis-[G]tress and [A]grief
My [D]soul has [G]often [D]found re-[A]lief
And [D]oft escaped the [G]tempter's [D]snare
By [D]thy re-[G]turn, sweet [A]hour of [D]prayer

{comment: Verse 2}
[D]Sweet hour of [G]prayer, sweet [D]hour of [A]prayer
Thy [D]wings shall my pe-[G]tition [A]bear
To [D]Him whose truth and [G]faithful-[D]ness
En-[D]gage the waiting [G]soul to [A]bless
And [D]since He bids me [G]seek His [A]face
Be-[D]lieve His [G]word and [D]trust His [A]grace
I'll [D]cast on Him my [G]every [D]care
And [D]wait for [G]thee, sweet [A]hour of [D]prayer
`,
  },
  {
    title: "Leaning on the Everlasting Arms",
    artist: "Elisha A. Hoffman (1887)",
    original_key: "G",
    bpm: 84,
    tags: ["hymn", "public-domain", "comfort"],
    chordpro_body: `{title: Leaning on the Everlasting Arms}
{key: G}

{comment: Verse 1}
[G]What a fellowship, what a [C]joy di-[G]vine
Leaning on the [D]everlasting [G]arms
[G]What a blessedness, what a [C]peace is [G]mine
Leaning on the [D]everlasting [G]arms

{comment: Chorus}
[G]Leaning, [C]leaning
[G]Safe and secure from all [D]a-[G]larms
[G]Leaning, [C]leaning
Leaning on the [D]everlasting [G]arms

{comment: Verse 2}
[G]Oh, how sweet to walk in this [C]pilgrim [G]way
Leaning on the [D]everlasting [G]arms
[G]Oh, how bright the path grows from [C]day to [G]day
Leaning on the [D]everlasting [G]arms

{comment: Verse 3}
[G]What have I to dread, what have [C]I to [G]fear
Leaning on the [D]everlasting [G]arms
[G]I have blessed peace with my [C]Lord so [G]near
Leaning on the [D]everlasting [G]arms
`,
  },
  {
    title: "Standing on the Promises",
    artist: "Russell Kelso Carter (1886)",
    original_key: "G",
    bpm: 100,
    tags: ["hymn", "public-domain", "faith"],
    chordpro_body: `{title: Standing on the Promises}
{key: G}

{comment: Verse 1}
[G]Standing on the promises of [C]Christ my [G]King
Through eternal ages let His [D]praises [G]ring
"Glory in the highest!" I will [C]shout and [G]sing
[D]Standing on the promises of [G]God

{comment: Chorus}
[G]Standing, [D]standing
Standing on the promises of [G]God my Savior
Standing, [D]standing
I'm standing on the promises of [G]God

{comment: Verse 2}
[G]Standing on the promises that [C]cannot [G]fail
When the howling storms of doubt and [D]fear as-[G]sail
By the living word of God I [C]shall pre-[G]vail
[D]Standing on the promises of [G]God

{comment: Verse 3}
[G]Standing on the promises of [C]Christ the [G]Lord
Bound to Him eternally by [D]love's strong [G]cord
Overcoming daily with the [C]Spirit's [G]sword
[D]Standing on the promises of [G]God

{comment: Verse 4}
[G]Standing on the promises I [C]cannot [G]fall
Listening every moment to the [D]Spirit's [G]call
Resting in my Savior as my [C]all in [G]all
[D]Standing on the promises of [G]God
`,
  },
  {
    title: "'Tis So Sweet to Trust in Jesus",
    artist: "Louisa M. R. Stead (1882)",
    original_key: "D",
    bpm: 78,
    tags: ["hymn", "public-domain", "trust"],
    chordpro_body: `{title: 'Tis So Sweet to Trust in Jesus}
{key: D}

{comment: Verse 1}
'Tis so [D]sweet to [G]trust in [D]Je-[A]sus
Just to [D]take Him [G]at His [A]Word
Just to [D]rest up-[G]on His [D]prom-[A]ise
Just to [D]know "Thus [G]saith the [A]Lord"

{comment: Chorus}
Jesus, [D]Jesus, [G]how I [A]trust Him
[D]How I've [G]proved Him [A]o'er and o'er
Jesus, [D]Jesus, [G]precious [A]Jesus
O for [D]grace to [G]trust Him [A]more

{comment: Verse 2}
O how [D]sweet to [G]trust in [D]Je-[A]sus
Just to [D]trust His [G]cleansing [A]blood
Just in [D]simple [G]faith to [D]plunge [A]me
'Neath the [D]healing, [G]cleansing [A]flood

{comment: Verse 3}
Yes, 'tis [D]sweet to [G]trust in [D]Je-[A]sus
Just from [D]sin and [G]self to [A]cease
Just from [D]Jesus [G]simply [D]tak-[A]ing
Life and [D]rest and [G]joy and [A]peace
`,
  },
  {
    title: "In the Garden",
    artist: "C. Austin Miles (1912)",
    original_key: "Ab",
    bpm: 75,
    tags: ["hymn", "public-domain", "devotional"],
    chordpro_body: `{title: In the Garden}
{key: Ab}

{comment: Verse 1}
I [Ab]come to the gar-[Db]den a-[Ab]lone
While the [Eb]dew is still [Ab]on the roses
And the [Ab]voice I hear, [Db]falling [Ab]on my ear
The [Eb]Son of God dis-[Ab]closes

{comment: Chorus}
And [Ab]He walks with [Eb]me, and He [Ab]talks with me
And He [Eb]tells me I am His [Ab]own
And the [Ab]joy we share as we [Db]tarry [Ab]there
None [Ab]other has [Eb]ever [Ab]known

{comment: Verse 2}
He [Ab]speaks, and the [Db]sound of [Ab]His voice
Is so [Eb]sweet the birds hush [Ab]their singing
And the [Ab]melody [Db]that He [Ab]gave to me
With-[Eb]in my heart is [Ab]ringing

{comment: Verse 3}
I'd [Ab]stay in the [Db]garden with [Ab]Him
Tho' the [Eb]night around me be [Ab]falling
But He [Ab]bids me go; [Db]through the [Ab]voice of woe
His [Eb]voice to me is [Ab]calling
`,
  },
  {
    title: "Silent Night",
    artist: "Joseph Mohr / Franz Gruber (1818)",
    original_key: "C",
    bpm: 64,
    tags: ["hymn", "public-domain", "christmas"],
    chordpro_body: `{title: Silent Night}
{key: C}

{comment: Verse 1}
[C]Silent night, holy night
[G7]All is calm, [C]all is bright
[F]Round yon vir-[C]gin mother and child
[F]Holy infant, [C]tender and mild
[G7]Sleep in heavenly [C]peace
[C]Sleep in [G7]heavenly [C]peace

{comment: Verse 2}
[C]Silent night, holy night
[G7]Shepherds quake [C]at the sight
[F]Glories stream from [C]heaven afar
[F]Heavenly hosts sing [C]"Alleluia!"
[G7]Christ, the Savior, is [C]born
[C]Christ, the [G7]Savior, is [C]born

{comment: Verse 3}
[C]Silent night, holy night
[G7]Son of God, [C]love's pure light
[F]Radiant beams from [C]Thy holy face
[F]With the dawn of re-[C]deeming grace
[G7]Jesus, Lord, at Thy [C]birth
[C]Jesus, [G7]Lord, at Thy [C]birth
`,
  },
  {
    title: "Hark! The Herald Angels Sing",
    artist: "Charles Wesley (1739)",
    original_key: "F",
    bpm: 96,
    tags: ["hymn", "public-domain", "christmas"],
    chordpro_body: `{title: Hark! The Herald Angels Sing}
{key: F}

{comment: Verse 1}
[F]Hark! the [Bb]herald [F]angels [C]sing
[Dm]"Glory [Bb]to the [C]newborn [F]King!
[F]Peace on [Bb]earth, and [F]mercy [C]mild
[Dm]God and [Bb]sinners [C]recon-[F]ciled"
[Bb]Joyful, [F]all ye [Bb]nations, [F]rise
[Bb]Join the [F]triumph [Bb]of the [C]skies
With angelic [F]hosts pro-[Bb]claim
"Christ is [F]born in [C]Bethle-[F]hem"
[Bb]Hark! the [F]herald [Bb]angels [F]sing
"Glory [Bb]to the [C]newborn [F]King!"

{comment: Verse 2}
[F]Christ, by [Bb]highest [F]heav'n a-[C]dored
[Dm]Christ, the [Bb]ever-[C]lasting [F]Lord!
[F]Late in [Bb]time be-[F]hold Him [C]come
[Dm]Offspring [Bb]of the [C]Virgin's [F]womb
[Bb]Veiled in [F]flesh the [Bb]Godhead [F]see
[Bb]Hail th'in-[F]carnate [Bb]Dei-[C]ty
Pleased as man with [F]men to [Bb]dwell
Jesus, [F]our Em-[C]manu-[F]el
[Bb]Hark! the [F]herald [Bb]angels [F]sing
"Glory [Bb]to the [C]newborn [F]King!"

{comment: Verse 3}
[F]Hail the [Bb]heaven-[F]born Prince of [C]Peace!
[Dm]Hail the [Bb]Sun of [C]Right-[F]eousness!
[F]Light and [Bb]life to [F]all He [C]brings
[Dm]Risen [Bb]with [C]healing [F]in His wings
[Bb]Mild He [F]lays His [Bb]glory [F]by
[Bb]Born that [F]man no [Bb]more may [C]die
Born to raise the [F]sons of [Bb]earth
Born to [F]give them [C]second [F]birth
[Bb]Hark! the [F]herald [Bb]angels [F]sing
"Glory [Bb]to the [C]newborn [F]King!"
`,
  },
  {
    title: "O Come, All Ye Faithful",
    artist: "John Francis Wade (Latin, c. 1751; English trans. 1841)",
    original_key: "G",
    bpm: 88,
    tags: ["hymn", "public-domain", "christmas"],
    chordpro_body: `{title: O Come, All Ye Faithful}
{key: G}

{comment: Verse 1}
[G]O come, all ye [D]faithful, [G]joyful and tri-[D]umphant
[G]O [Em]come ye, O [Am]come ye, to [D]Bethle-[G]hem
[G]Come and be-[D]hold Him, [G]born the [D]King of [G]angels

{comment: Chorus}
[G]O come, let us [C]adore [G]Him
[G]O come, let us a-[D]dore [G]Him
[G]O come, let us a-[Em]dore [D]Him
[G]Christ, the [D]Lord

{comment: Verse 2}
[G]Sing, choirs of [D]angels, [G]sing in exul-[D]tation
[G]Sing, [Em]all ye [Am]citizens of [D]heaven a-[G]bove
[G]Glory to [D]God, all [G]glory [D]in the [G]highest

{comment: Verse 3}
[G]Yea, Lord, we [D]greet Thee, [G]born this happy [D]morning
[G]Je-[Em]sus, to [Am]Thee be all [D]glory [G]given
[G]Word of the [D]Father, [G]now in [D]flesh ap-[G]pearing
`,
  },
  {
    title: "O Little Town of Bethlehem",
    artist: "Phillips Brooks (1868)",
    original_key: "D",
    bpm: 72,
    tags: ["hymn", "public-domain", "christmas"],
    chordpro_body: `{title: O Little Town of Bethlehem}
{key: D}

{comment: Verse 1}
O [D]little town of [A]Beth-le-[D]hem
How [Bm]still we see thee [E]lie [A]
A-[D]bove thy deep and [A]dreamless [D]sleep
The [G]silent stars go [A]by
Yet [F#m]in thy dark streets [Bm]shineth
The [E]ever-[A]lasting [F#m]light
The [D]hopes and fears of [Bm]all the years
Are [D]met in [A]thee to-[D]night

{comment: Verse 2}
For [D]Christ is born of [A]Ma-[D]ry
And [Bm]gathered all a-[E]bove [A]
While [D]mortals sleep, the [A]angels [D]keep
Their [G]watch of wondering [A]love
O [F#m]morning stars to-[Bm]gether
Pro-[E]claim the [A]holy [F#m]birth
And [D]praises sing to [Bm]God the King
And [D]peace to [A]men on [D]earth

{comment: Verse 3}
O [D]holy Child of [A]Beth-le-[D]hem
De-[Bm]scend to us, we [E]pray [A]
Cast [D]out our sin and [A]enter [D]in
Be [G]born in us to-[A]day
We [F#m]hear the Christmas [Bm]angels
The [E]great glad [A]tidings [F#m]tell
O [D]come to us, a-[Bm]bide with us
Our [D]Lord, Em-[A]manu-[D]el
`,
  },
  {
    title: "Angels We Have Heard on High",
    artist: "Traditional French (1862)",
    original_key: "F",
    bpm: 84,
    tags: ["hymn", "public-domain", "christmas"],
    chordpro_body: `{title: Angels We Have Heard on High}
{key: F}

{comment: Verse 1}
[F]Angels we have [C]heard on [F]high
[Bb]Sweetly [F]singing [C]o'er the [F]plains
[F]And the mountains [C]in re-[F]ply
[Bb]Echoing [F]their [C]joyous [F]strains

{comment: Chorus}
[F]Glo-[Bb]o-[F]o-[C7]o-[F]o-[Bb]o-[F]o-[C7]o-[F]ria
[Bb]In ex-[F]celsis [C]De-[F]o
[F]Glo-[Bb]o-[F]o-[C7]o-[F]o-[Bb]o-[F]o-[C7]o-[F]ria
[Bb]In ex-[F]celsis [C]De-[F]o

{comment: Verse 2}
[F]Shepherds, why this [C]jubi-[F]lee?
[Bb]Why your [F]joyous [C]strains pro-[F]long?
[F]What the gladsome [C]tidings [F]be
[Bb]Which in-[F]spire your [C]heavenly [F]song?

{comment: Verse 3}
[F]Come to Bethle-[C]hem and [F]see
[Bb]Him whose [F]birth the [C]angels [F]sing
[F]Come, adore on [C]bended [F]knee
[Bb]Christ, the [F]Lord, the [C]newborn [F]King
`,
  },
  {
    title: "Come, Thou Long Expected Jesus",
    artist: "Charles Wesley (1744)",
    original_key: "D",
    bpm: 72,
    tags: ["hymn", "public-domain", "advent", "christmas"],
    chordpro_body: `{title: Come, Thou Long Expected Jesus}
{key: D}

{comment: Verse 1}
[D]Come, Thou long ex-[G]pected [D]Jesus
[A]Born to set Thy [D]people free
From our [D]fears and [G]sins re-[D]lease us
[A]Let us find our [D]rest in Thee
[D]Israel's [G]strength and [D]consolation
[A]Hope of all the [D]earth Thou art
Dear de-[D]sire of [G]every [D]nation
[A]Joy of every [D]longing heart

{comment: Verse 2}
[D]Born Thy people [G]to de-[D]liver
[A]Born a child and [D]yet a King
Born to [D]reign in [G]us for-[D]ever
[A]Now Thy gracious [D]kingdom bring
By Thine [D]own e-[G]ternal [D]Spirit
[A]Rule in all our [D]hearts alone
By Thine [D]all suf-[G]ficient [D]merit
[A]Raise us to Thy [D]glorious throne
`,
  },
  {
    title: "Pass Me Not, O Gentle Savior",
    artist: "Fanny Crosby (1868)",
    original_key: "D",
    bpm: 78,
    tags: ["hymn", "public-domain", "invitation"],
    chordpro_body: `{title: Pass Me Not, O Gentle Savior}
{key: D}

{comment: Verse 1}
[D]Pass me not, O [G]gentle [D]Savior
[A]Hear my humble [D]cry
[D]While on others [G]Thou art [D]calling
[A]Do not pass me [D]by

{comment: Chorus}
[D]Savior, [G]Savior
[A]Hear my humble [D]cry
[D]While on others [G]Thou art [D]calling
[A]Do not pass me [D]by

{comment: Verse 2}
[D]Let me at Thy [G]throne of [D]mercy
[A]Find a sweet re-[D]lief
[D]Kneeling there in [G]deep con-[D]trition
[A]Help my unbe-[D]lief

{comment: Verse 3}
[D]Trusting only [G]in Thy [D]merit
[A]Would I seek Thy [D]face
[D]Heal my wounded, [G]broken [D]spirit
[A]Save me by Thy [D]grace

{comment: Verse 4}
[D]Thou the spring of [G]all my [D]comfort
[A]More than life to [D]me
[D]Whom have I on [G]earth be-[D]side Thee
[A]Whom in heaven but [D]Thee
`,
  },
  {
    title: "His Eye Is on the Sparrow",
    artist: "Civilla D. Martin (1905)",
    original_key: "Db",
    bpm: 70,
    tags: ["hymn", "public-domain", "comfort"],
    chordpro_body: `{title: His Eye Is on the Sparrow}
{key: Db}

{comment: Verse 1}
[Db]Why should I feel dis-[Gb]couraged
Why should the [Db]shadows come
Why should my [Bbm]heart be lonely
And long for [Eb7]heav'n and [Ab7]home
When [Db]Jesus is my [Gb]portion
My constant [Db]friend is He
His [Gb]eye is on the [Db]sparrow
And I [Bbm]know He [Ab7]watches [Db]me

{comment: Chorus}
I [Db]sing because I'm [Gb]happy
I [Db]sing because I'm [Gb]free
For His [Gb]eye is on the [Db]sparrow
And I [Bbm]know He [Ab7]watches [Db]me

{comment: Verse 2}
[Db]"Let not your heart be [Gb]troubled,"
His tender [Db]word I hear
And resting [Bbm]on His goodness
I lose my [Eb7]doubts and [Ab7]fears
Though [Db]by the path He [Gb]leadeth
But one step [Db]I may see
His [Gb]eye is on the [Db]sparrow
And I [Bbm]know He [Ab7]watches [Db]me

{comment: Verse 3}
When-[Db]ever I am [Gb]tempted
Whenever [Db]clouds arise
When songs give [Bbm]place to sighing
When hope with-[Eb7]in me [Ab7]dies
I [Db]draw the closer [Gb]to Him
From care He [Db]sets me free
His [Gb]eye is on the [Db]sparrow
And I [Bbm]know He [Ab7]watches [Db]me
`,
  },
  {
    title: "Higher Ground",
    artist: "Johnson Oatman, Jr. (1898)",
    original_key: "Eb",
    bpm: 100,
    tags: ["hymn", "public-domain", "consecration"],
    chordpro_body: `{title: Higher Ground}
{key: Eb}

{comment: Verse 1}
[Eb]I'm pressing on the [Ab]upward [Eb]way
New [Bb7]heights I'm gaining [Eb]every day
Still [Eb]praying as I'm [Ab]onward [Eb]bound
"Lord, [Bb7]plant my feet on [Eb]higher ground"

{comment: Chorus}
Lord, [Eb]lift me up and [Ab]let me [Eb]stand
By [Bb7]faith on heaven's [Eb]tableland
A [Eb]higher plane than [Ab]I have [Eb]found
Lord, [Bb7]plant my feet on [Eb]higher ground

{comment: Verse 2}
My [Eb]heart has no de-[Ab]sire to [Eb]stay
Where [Bb7]doubts arise and [Eb]fears dismay
Though [Eb]some may dwell where [Ab]these a-[Eb]bound
My [Bb7]prayer, my aim, is [Eb]higher ground

{comment: Verse 3}
I [Eb]want to live a-[Ab]bove the [Eb]world
Though [Bb7]Satan's darts at [Eb]me are hurled
For [Eb]faith has caught the [Ab]joyful [Eb]sound
The [Bb7]song of saints on [Eb]higher ground

{comment: Verse 4}
I [Eb]want to scale the [Ab]utmost [Eb]height
And [Bb7]catch a gleam of [Eb]glory bright
But [Eb]still I'll pray till [Ab]heav'n I've [Eb]found
"Lord, [Bb7]lead me on to [Eb]higher ground"
`,
  },
  {
    title: "Have Thine Own Way, Lord",
    artist: "Adelaide A. Pollard (1907)",
    original_key: "Eb",
    bpm: 76,
    tags: ["hymn", "public-domain", "consecration"],
    chordpro_body: `{title: Have Thine Own Way, Lord}
{key: Eb}

{comment: Verse 1}
[Eb]Have Thine own [Ab]way, [Eb]Lord
[Bb7]Have Thine own [Eb]way
[Eb]Thou art the [Ab]potter
[Bb7]I am the [Eb]clay
[Eb]Mold me and [Ab]make me
[Bb7]After Thy [Eb]will
[Bb7]While I am [Eb]waiting
[Ab]Yielded and [Bb7]still

{comment: Verse 2}
[Eb]Have Thine own [Ab]way, [Eb]Lord
[Bb7]Have Thine own [Eb]way
[Eb]Search me and [Ab]try me
[Bb7]Master, to-[Eb]day
[Eb]Whiter than [Ab]snow, Lord
[Bb7]Wash me just [Eb]now
[Bb7]As in Thy [Eb]presence
[Ab]Humbly I [Bb7]bow

{comment: Verse 3}
[Eb]Have Thine own [Ab]way, [Eb]Lord
[Bb7]Have Thine own [Eb]way
[Eb]Wounded and [Ab]weary
[Bb7]Help me, I [Eb]pray
[Eb]Power, all [Ab]power
[Bb7]Surely is [Eb]Thine
[Bb7]Touch me and [Eb]heal me
[Ab]Savior di-[Bb7]vine

{comment: Verse 4}
[Eb]Have Thine own [Ab]way, [Eb]Lord
[Bb7]Have Thine own [Eb]way
[Eb]Hold o'er my [Ab]being
[Bb7]Absolute [Eb]sway
[Eb]Fill with Thy [Ab]Spirit
[Bb7]Till all shall [Eb]see
[Bb7]Christ only, [Eb]always
[Ab]Living in [Bb7]me
`,
  },
  {
    title: "All Creatures of Our God and King",
    artist: "St. Francis of Assisi (1225) / William Draper (1919)",
    original_key: "D",
    bpm: 96,
    tags: ["hymn", "public-domain", "praise"],
    chordpro_body: `{title: All Creatures of Our God and King}
{key: D}

{comment: Verse 1}
[D]All creatures of our [Bm]God and King
[A]Lift up your voice and [D]with us sing
Alle-[A]lu-[D]ia! Alle-[A]lu-[D]ia!
[D]Thou burning sun with [Bm]golden beam
[A]Thou silver moon with [D]softer gleam
O [G]praise Him, [D]O praise Him
[A]Alle-[D]lu-[A]ia, alle-[D]lu-[A]ia, alle-[D]lu-[A]ia!

{comment: Verse 2}
[D]Thou rushing wind that [Bm]art so strong
[A]Ye clouds that sail in [D]heav'n along
O [A]praise [D]Him! Alle-[A]lu-[D]ia!
[D]Thou rising morn, in [Bm]praise rejoice
[A]Ye lights of evening, [D]find a voice
O [G]praise Him, [D]O praise Him
[A]Alle-[D]lu-[A]ia, alle-[D]lu-[A]ia, alle-[D]lu-[A]ia!

{comment: Verse 3}
[D]Let all things their Cre-[Bm]ator bless
[A]And worship Him in [D]humbleness
O [A]praise [D]Him! Alle-[A]lu-[D]ia!
[D]Praise, praise the Fa-[Bm]ther, praise the Son
[A]And praise the Spirit, [D]Three in One
O [G]praise Him, [D]O praise Him
[A]Alle-[D]lu-[A]ia, alle-[D]lu-[A]ia, alle-[D]lu-[A]ia!
`,
  },
  {
    title: "When the Roll Is Called Up Yonder",
    artist: "James M. Black (1893)",
    original_key: "G",
    bpm: 110,
    tags: ["hymn", "public-domain", "heaven"],
    chordpro_body: `{title: When the Roll Is Called Up Yonder}
{key: G}

{comment: Verse 1}
[G]When the trumpet of the [C]Lord shall [G]sound, and time shall be no [D]more
And the [G]morning breaks, e-[C]ternal, [G]bright and [D]fair
When the [G]saved of earth shall [C]gather [G]over on the other [D]shore
And the [G]roll is called up [D]yonder, I'll be [G]there

{comment: Chorus}
When the [G]roll, is called up [C]yon-[G]der
When the roll, is called up [D]yon-[A]der
When the [G]roll, is called up [C]yon-[G]der
When the [G]roll is called up [D]yonder, I'll be [G]there

{comment: Verse 2}
[G]On that bright and cloudless [C]morning [G]when the dead in Christ shall [D]rise
And the [G]glory of His [C]res-ur-[G]rection [D]share
When His [G]chosen ones shall [C]gather [G]to their home beyond the [D]skies
And the [G]roll is called up [D]yonder, I'll be [G]there

{comment: Verse 3}
[G]Let us labor for the [C]Master [G]from the dawn till setting [D]sun
Let us [G]talk of all His [C]wondrous [G]love and [D]care
Then when [G]all of life is [C]over, [G]and our work on earth is [D]done
And the [G]roll is called up [D]yonder, I'll be [G]there
`,
  },

  // ============================================================
  // Folk / spiritual roots — "modern-feeling" but actually PD
  // ============================================================
  {
    title: "Wayfaring Stranger",
    artist: "American folk spiritual (early 1800s)",
    original_key: "Am",
    bpm: 70,
    tags: ["spiritual", "public-domain", "folk"],
    chordpro_body: `{title: Wayfaring Stranger}
{key: Am}

{comment: Verse 1}
I am a [Am]poor wayfaring stranger
A trav'ling [Dm]through this world of [Am]woe
But there's no [F]sickness, toil, nor [E]danger
In that bright [Am]world to [E]which I [Am]go

{comment: Chorus}
I'm going [F]there to see my [E]Father
I'm going there [Am]no more to [E]roam
I'm only [Am]going over Jordan
I'm only [Dm]going [E]over [Am]home

{comment: Verse 2}
I know dark [Am]clouds will gather 'round me
I know my [Dm]way is rough and [Am]steep
But beauteous [F]fields lie just be-[E]fore me
Where God's re-[Am]deemed their [E]vigils [Am]keep

{comment: Verse 3}
I'll soon be [Am]free from every trial
My body [Dm]sleep in the church-[Am]yard
I'll drop the [F]cross of self-de-[E]nial
And enter [Am]on my great [E]re-[Am]ward
`,
  },
  {
    title: "Down to the River to Pray",
    artist: "American folk spiritual (1867)",
    original_key: "G",
    bpm: 85,
    tags: ["spiritual", "public-domain", "folk", "baptism"],
    chordpro_body: `{title: Down to the River to Pray}
{key: G}

{comment: Verse 1}
As [G]I went down in the [C]river to [G]pray
[C]Studyin' a-[G]bout that good ol' [Em]way
And [G]who shall wear the [C]starry [G]crown?
[Em]Good Lord, [G]show me the [Em]way

{comment: Chorus}
O [G]sisters, let's go [Em]down
Let's go [G]down, come on [C]down
O [G]sisters, let's go [Em]down
[C]Down in the [G]river to [Em]pray

{comment: Verse 2}
As [G]I went down in the [C]river to [G]pray
[C]Studyin' a-[G]bout that good ol' [Em]way
And [G]who shall wear the [C]robe and [G]crown?
[Em]Good Lord, [G]show me the [Em]way

{comment: Chorus}
O [G]brothers, let's go [Em]down
Let's go [G]down, come on [C]down
[G]Brothers, let's go [Em]down
[C]Down in the [G]river to [Em]pray
`,
  },
  {
    title: "Take My Life and Let It Be",
    artist: "Frances R. Havergal (1874)",
    original_key: "F",
    bpm: 78,
    tags: ["hymn", "public-domain", "consecration"],
    chordpro_body: `{title: Take My Life and Let It Be}
{key: F}

{comment: Verse 1}
[F]Take my life, and [Bb]let it [F]be
Conse[Bb]crated, [C]Lord, to [F]Thee
Take my [Bb]moments [F]and my [C]days
Let them [Bb]flow in [F]ceaseless [C]praise
Let them [Bb]flow in [F]ceaseless [C]praise

{comment: Verse 2}
[F]Take my hands, and [Bb]let them [F]move
At the [Bb]impulse [C]of Thy [F]love
Take my [Bb]feet, and [F]let them [C]be
Swift and [Bb]beautiful [F]for [C]Thee
Swift and [Bb]beautiful [F]for [C]Thee

{comment: Verse 3}
[F]Take my voice, and [Bb]let me [F]sing
Always, [Bb]only, [C]for my [F]King
Take my [Bb]lips, and [F]let them [C]be
Filled with [Bb]messages [F]from [C]Thee
Filled with [Bb]messages [F]from [C]Thee

{comment: Verse 4}
[F]Take my silver [Bb]and my [F]gold
Not a [Bb]mite would [C]I with[F]hold
Take my [Bb]intellect, [F]and [C]use
Every [Bb]power as [F]Thou shalt [C]choose
Every [Bb]power as [F]Thou shalt [C]choose

{comment: Verse 5}
[F]Take my love, my [Bb]Lord, I [F]pour
At Thy [Bb]feet its [C]treasure [F]store
Take my[Bb]self, and [F]I will [C]be
Ever, [Bb]only, [F]all for [C]Thee
Ever, [Bb]only, [F]all for [C]Thee
`,
  },
];

// (one stray closing bracket removed)

// Use the first leader account as created_by, if any.
const { data: leader } = await supabase
  .from("profiles")
  .select("id")
  .eq("role", "leader")
  .limit(1)
  .maybeSingle();

const created_by = leader?.id ?? null;

// Skip songs that already exist (by exact title).
const titles = songs.map((s) => s.title);
const { data: existing } = await supabase
  .from("songs")
  .select("title")
  .in("title", titles);
const have = new Set((existing ?? []).map((s) => s.title));

const toInsert = songs
  .filter((s) => !have.has(s.title))
  .map((s) => ({ ...s, created_by }));

if (toInsert.length === 0) {
  console.log("All hymns already present. Nothing to insert.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("songs")
  .insert(toInsert)
  .select("id, title");

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} song(s):`);
for (const s of data) console.log(`  · ${s.title}`);
if (have.size > 0) console.log(`(${have.size} already existed, skipped)`);
