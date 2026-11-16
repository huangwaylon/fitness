// REVIEW 2026-11-17 (2nd review; earlier R fixes were from the first): pass 6, fix 15, drop 3, new 1; ear checks 1
// Open: a cold re-read (fresh subagent, no keys) still picked d4 (75 %), a1, g3 (70 %), i3, d1 (65 %) and g1, s1, i2,
//   f1, f2 (60 %), mostly from featurette sense ("grew up watching", "excited but scared", "found a way"). These are
//   third passes for several; if the phone read agrees, retire d4 and a1 rather than rewrite them again.
// “Josh Peck Joins iCarly Season 2! 😱 | NickRewind” (NickRewind, Best of iCarly): a behind-the-scenes featurette.
// Josh Peck talks about Miranda, Jerry Trainor and Nathan directing; Nathan talks about directing Josh; then come Josh's
// summary of the episode, laughing on set, and a view on reboots, with short scene inserts between them.
// Segments from the captions, words from whisper (2026-11-16). Josh names himself at 0 s; the 110–129 s story is his
// (“I never got the chance to work with him”, about Nathan); the 130–173 s speaker is the director Josh names (Nathan:
// “a huge guest star in Josh Peck… direct him”). The speakers of 236–250 s, 256–280 s and 292–356 s aren't named, so
// those items say “the speaker” and no key rests on who it is. No item uses the garbled inserts (68–75 s, 82–91 s,
// 221–236 s, 250–254 s).
// EAR CHECK: 64.5–65.3 s c3 — “what would become” (both sources): “what” and “would” really run together
import type { Clip } from '../types.ts';

export const peckJoins: Clip = {
  id: 'peckjoins', video: '_IymSiWwhKg', title: 'Josh Peck Joins iCarly Season 2!', dur: 374, wpm: 183, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 %: the key was the only warm choice and "a new cast he'd only seen on TV" nobody would
    //   pick. That one becomes "a big brother to the whole cast" (keyword trap), so two choices are warm now.
    // R fix: V2 (blind 55 %, second pass) — the key was still the only warm reason that fit an opening about one
    //   person. "A whole season" becomes "a director he grew up watching" (Nathan's later line, turned around).
    // why: director he grew up watching ← "grew up watching him on TV" is said later, but by Nathan about Josh;
    //   big brother to the cast ←
    //   "I just feel like her older brother" is said, but it's his feeling for Miranda, not how the cast treats him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reunion', reveals: ['friends', 'idol'], seg: [0, 59.7],
      stem: 'From Josh’s opening, what makes this job special for him?',
      choices: ['Working again with someone he calls a real friend', 'Being treated like a big brother by the whole cast',
                'Working with a director he grew up watching'], a: 0,
      cue: '最初の1分、Miranda について話すところ。',
      said: 'Miranda とまた働けるのは夢のようで、本当の友だちだと言う。',
      mean: '話の中心は、昔の仲間との再会。',
      trap: 'grew up watching は後の Nathan の話。older brother は Miranda への気持ちで、周りの扱いでない。',
      use: 'It’s a dream to work with you again.（また一緒に働けるなんて夢みたい）' },

    // R fix: V2, blind 70 %: the key was the only warm choice. Both distractors are friendly now, and none is "old
    //   friends who rarely talk", which nobody would say of a co-star he calls a dream to work with.
    // R fix: V2 (blind 65 %, second pass) — the key was still the only close friendship. "Friendly coworkers who chat
    //   about weekends" becomes "best friends who catch up on weekends": as warm as the key, built on the same word.
    // why: weekends ← "weekend" is said, but inside the example of what they are not; close only on set ← "craft
    //   service" puts the example on set, but "real life friends" is the point
    { id: 'd1', skill: 'detail', level: 'B1', point: 'friends', seg: [9, 21],
      stem: 'How does Josh describe his friendship with Miranda?',
      choices: ['Real friends, not just coworkers passing by', 'Best friends who catch up on weekends',
                'Close on set, but they rarely meet off set'], a: 0,
      cue: '「actually friends」のあと、比べている例。',
      line: 'We’re like *actually friends*, like real life friends, *not just like*, hey, how was your weekend',
      said: '「本当の友だち。撮影所ですれ違って『週末どうだった？』と言うだけの仲じゃない」。',
      mean: 'not just like ～ ＝「～程度の仲ではない」。',
      trap: '週末の話や目を合わせない様子は、比べるための例。not just のあとは否定される側。',
      use: 'We’re actually friends, not just neighbors.（ただのご近所じゃなく、本当の友だち）' },

    // R fix: S4: the evidence for the key ("It's surreal for me to see her now", 22.3 s) was before the segment.
    //   The segment starts at 21.0 s now, after "eye contact".
    // R fix: C6 — moved above n1: its segment starts at 21 s, n1's at 24.3 s.
    // R fix: V2 (blind 50 %) — "starts a new story" was easy to rule out (none follows). Now "softens the age
    //   remark", the 気づかい reading of I mean after a woman's age.
    // why: corrects ← "I mean" as a self-correction (言い直し), but 28 stands; softens ← age talk heard as touchy, so
    //   "I mean" read as a softener (気づかい), but it adds a reason: he met her at eight
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['eight'], seg: [21, 28.65],
      stem: 'Right after giving Miranda’s age now, what does Josh’s next phrase do?',
      choices: ['Adds why her age feels so strange to him', 'Corrects the age he has just given for her',
                'Softens the age remark so it isn’t rude'], a: 0,
      cue: '年齢を言った直後、短い前置き。',
      line: 'It’s *surreal* for me to see her now. I think she’s 28… *I mean*, I met her when she was eight.',
      said: '「今28歳かな。だって、会ったのは8歳のときだよ」と続けている。',
      mean: 'I mean はここでは訂正ではなく「だってね」。28歳が不思議に感じる理由を足している。',
      trap: 'I mean は言い直しにも使うが、28 は訂正されていない。ここは補足の合図。',
      use: 'So tall now! I mean, he was tiny.（すごく背が伸びた。だって小さかったのに）' },

    // why: 28 ← the last number heard before; 18 ← -teen/-ty, and "eight" can sound like the end of "eighteen"
    { id: 'n1', skill: 'number', level: 'B1', point: 'eight', seg: [24.3, 28.65], keep: true,
      stem: 'How old was Miranda when Josh first met her?',
      choices: ['8', '18', '28'], a: 0,
      cue: '「I mean」のあと、文の最後の数字。',
      line: 'I think she’s 28 years old. I mean, I met her *when she was eight*.',
      said: '「今は28歳かな。初めて会ったときは8歳だった」と言っている。',
      mean: '今の年齢と出会った年齢を並べ、付き合いの長さと、成長への驚きを伝えている。',
      trap: '直前の28が耳に残りやすい。eighteen なら「ティーン」と長く伸びる音がある。',
      use: 'I’ve known her since she was eight.（彼女が8歳のころから知ってる）' },

    // R fix: V2 (blind 50 %) — "help write his own part" was the odd one out. Now a second few-episodes choice with
    //   the wrong condition (Miranda asking), so the condition must be heard.
    // why: whole season ← "right part" heard as "a big part"; Miranda asked ← she is the one he's talking to, so the
    //   condition is heard as her request, not the part
    { id: 'd3', skill: 'detail', level: 'B2', point: 'part', seg: [44.7, 59.7],
      stem: 'What did Josh tell Miranda when she first brought up the reboot?',
      choices: ['He’d come for a few episodes once the right part came up',
                'He’d come for the whole season if the part was big enough',
                'He’d come for a few episodes if Miranda asked him to'], a: 0,
      cue: '「I told her like, well」のあと。',
      line: 'when the *right part* comes along… just sort of have fun for *a couple episodes*',
      said: '「ちょうどいい役があれば、数話だけ出て楽しみたい」と伝えていた。',
      mean: 'a couple episodes ＝ 2、3話。気軽な参加のつもりだった。',
      trap: 'right part を「大きな役」と取りやすいが、right は「ぴったりの」。量の話ではない。',
      use: 'When the right job comes along, I’ll know.（ぴったりの仕事が来たら分かるよ）' },

    // R fix: V2/K5 (blind 60 %) — "I'll love to come" isn't English, which left the key against two. Cut to three.
    //   N7: the stem quotes "when the right part comes along", d3's key, so it reveals 'part'.
    // why: I love ← the d of I'd is swallowed by the l; I'd like ← same frame, only the vowel and the final k/v decide
    { id: 's1', skill: 'sound', level: 'B2', point: 'love', reveals: ['part'], seg: [49, 55.2],
      stem: 'Fill the gap: “when the right part comes along, ___ to come and play.”',
      choices: ['I’d love', 'I love', 'I’d like'], a: 0,
      cue: '「comes along」のすぐあと、短い2語。',
      line: 'when the right part comes along, *I’d love* to come and play',
      said: '「ちょうどいい役が来たら、ぜひ出たい」と言っている。',
      mean: 'I’d love to ＝「ぜひ〜したい」。仮の話なので would が入る。',
      trap: 'I’d の d は次の l に飲まれ、I love に聞こえやすい。仮の話なら would を補う。',
      use: 'I’d love to come, if you’ll have me.（よければぜひ行きたい）' },

    // R new: C2, replaces c1. Both sources agree on the words (captions: what 64.48, would 64.72, become 64.88).
    // anchor: 64.5–65.3 s both sources “came in to play what would become Crazy Steve”: “what” loses its t into
    //   “would”, and “would” is a weak “wəd”
    { id: 'c3', skill: 'dict', level: 'C2', point: 'become', seg: [60.95, 66.3],
      stem: 'Type the words: “…came in to play ___ Crazy Steve.” (3 words)', answer: 'what would become',
      cue: '「to play」のすぐあと、役の名前の前。',
      line: 'Jerry… came in to play *what would become* Crazy Steve.',
      said: 'のちに Crazy Steve になる役で入ってきた、と話す。',
      mean: 'what would become ＝ のちに～になるもの。what の t が消え「ワウッビカム」。',
      trap: 'what を落として would become だけ書きやすい。',
      use: 'We found what would become our favorite café.（のちに行きつけになるカフェを見つけた）' },

    // R drop: i1 (Jerry's part outlasted expectations) — 75 % blind after one rewrite: a "nobody expected more than one
    //   episode" story can only end one way, and "what would become Crazy Steve" says so before the segment. Deleted.
    { id: 'x1', skill: 'dict', level: 'B2', point: 'crackup', seg: [92.2, 100.2],
      stem: 'Type what Josh says: “He’s always made me just ___.” (2 words)', answer: 'crack up',
      cue: '「genius」のあと、「so」の直前。',
      line: 'He’s always made me just *crack up*',
      said: '「彼にはいつも笑わされる」と言っている。',
      mean: 'crack up ＝ 思わず吹き出す。make me crack up で「笑わせてくれる」。',
      trap: 'crack の k と up がつながり「クラカップ」と一語に聞こえやすい。2語で探す。',
      use: 'That video always cracks me up.（あの動画、いつも笑っちゃう）' },

    // why: funnier again ← "Funny" taken at face value and "either time" heard as "this time"; stealing ← right
    //   mechanism, wrong target: "I just made that joke" is the complaint, but the last line hits both of them
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cluck', seg: [99.6, 110.85],
      stem: 'In the chicken-costume clip, why is the last line funny?',
      choices: ['Two people are proud of a pun that fell flat both times',
                'The speaker admits the pun got funnier when it was redone',
                'The speaker teases one of them for stealing the joke'], a: 0,
      cue: '「joke」のあとの返事と、最後の一言の終わり。',
      line: 'what the cluck… *I just made that joke*… Funny how I didn’t laugh *either time*.',
      said: '同じ鶏のダジャレを二人が言い合い、最後に「どっちの時も笑わなかったけど」と一言。',
      mean: 'either time ＝ 2回とも。得意げな二人を、冷めた一言で落としている。',
      trap: 'Funny how ～ は「～なのは妙だね」という皮肉の型。「面白い」ではない。',
      use: 'Funny how you vanish on cleaning day.（掃除の日に限って消えるのは妙だね）' },

    // R fix: V2, blind 55 %: the key was the only choice that flatters Nathan. Now one distractor flatters him too
    //   (he let Josh loose), and the other puts "seriously" in Nathan's mouth instead of Josh's.
    // R fix: V2 (blind 60 %, second pass) — "Nathan let Josh do whatever he wanted" was still easy to drop. Now "Josh
    //   saw Nathan was nervous", from Nathan's own "very scary for me" later on.
    // why: nervous ← "very scary for me" is Nathan's own later line, not what Josh saw; told to
    //   be serious ← right word, wrong speaker: "taken seriously" is Josh's own joke, Nathan asks nothing
    { id: 'i2', skill: 'infer', level: 'C1', point: 'nathan', seg: [116.6, 129.2],
      stem: 'In Josh’s story about Nathan directing, what changed once Nathan was on set?',
      choices: ['Josh saw Nathan knew his job and got serious', 'Josh saw Nathan was nervous and went easy on him',
                'Nathan told Josh to take the part more seriously'], a: 0,
      cue: '「as soon as Nathan」のあと。',
      line: 'I’m just going to *do whatever I want*… *oh, you know what you’re doing*. I’m ready to be taken seriously',
      said: '最初は「好きにやろう」と思っていたが、Nathan を見て「分かってる人だ」と考えを変えた。',
      mean: '監督ぶりへの、冗談まじりのほめ言葉。',
      trap: 'do whatever I want は Josh の最初の考え。Nathan に気をつかう話は出ない。',
      use: 'Okay, you clearly know what you’re doing.（なるほど、ちゃんと分かってるね）' },

    // R drop: c1 (C2, who the joke is on) — 60 % blind after its one rewrite (self-mockery is the featurette's default),
    //   and it shared i2's point and segment. Deleted; c3 replaces it.
    // R fix: C2 V2 (blind 50 %, its one rewrite) — "one of the biggest" was the only choice keeping "one of". Now
    //   "might be one of the biggest, hard to say" keeps the scope and misreads the softeners.
    // why: might be one of ← "I would say… fairly" read as real doubt (かもしれない), "safely" lost; the single
    //   biggest ← scope shift: "one of" lost in fast speech
    // anchor: 140.1–146.1 s "this, I would say, is fairly safely one of the biggest ones that we ever did": softeners
    //   on a claim already limited by "one of"
    { id: 'c2', skill: 'infer', level: 'C2', point: 'biggest', seg: [135.9, 146.35],
      stem: 'Which plain-English version keeps what Nathan says about this episode?',
      choices: ['“It’s easily one of the biggest we’ve done.”', '“It might be one of the biggest, hard to say.”',
                '“It’s the single biggest one we’ve done.”'], a: 0,
      cue: '「I would say」のあと、控えめな語と範囲の語。',
      line: 'this, *I would say*, is *fairly safely one of the biggest* ones that we ever did',
      said: '「まず確実に、一番大きい回の一つ」と話す。',
      mean: 'I would say や fairly safely は迷いでなく、言い切りを和らげる語。',
      trap: '控えめな語を自信のなさと取りやすく、one of が消えると「一番」に聞こえる。',
      use: 'Easily one of the best meals ever.（文句なしに、最高の食事の一つ）' },

    // R fix: V2, blind 70 %: "heard Josh was hard to direct" is an unkind filler nobody picks in a featurette. It
    //   becomes a third near sound on "grew up w…", so the verb after "grew up" decides.
    // R fix: V2 (blind 75 %, second pass) — "wanting to be on TV like Josh" was weak next to an idol. Now "being
    //   compared to Josh", a real reason to be intimidated.
    // why: working with ← watching/working share the onset, and they're old castmates in other pairs; compared ←
    //   "intimidation" heard as rivalry, with the verb after "grew up" lost
    { id: 'd4', skill: 'detail', level: 'B1', point: 'idol', seg: [146, 159],
      stem: 'Why was working with Josh intimidating for Nathan?',
      choices: ['He grew up watching Josh on TV', 'He grew up working with Josh on TV',
                'He grew up being compared to Josh'], a: 0,
      cue: '「intimidation for me because」のあと。',
      line: 'because I literally *grew up watching him* on TV and he was like one of my *comedy idols*',
      said: '「子どものころからテレビで見ていた、憧れのコメディアンだった」から緊張したと話す。',
      mean: '憧れの人を相手に、演出までする重圧。',
      trap: 'watching と working は語頭が似ている。二人の共演は今回が初めて、と Josh も話している。',
      use: 'He was one of my childhood heroes.（子どものころのヒーローの一人だった）' },

    // R fix: K1/K3/S4: "Relaxed" was half true ("very easy to work with him") and "annoyed by Josh's jokes" was a
    //   filler. Now "Calm, since he'd directed Josh before" (refuted by "not only work with him but then direct
    //   him") and "sure the scenes would work" (the words said, wrong relation). The segment started mid "then
    //   direct him"; it starts at 158.85 s now.
    // R fix: V2 (blind 80 %, second pass) — the key was the only mixed feeling. Now a second scared choice with the
    //   wrong reason ("Josh is hard to work with"), which "nicest… very easy to work with" refutes.
    // why: calm ← "easy" and "fun" come last and stick, so it sounds familiar; scared of Josh ← "intimidation" and
    //   "scary" heard, the reason after "luckily" lost
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'scary', seg: [158.85, 173.85],
      stem: 'How did Nathan feel about directing Josh’s scenes?',
      choices: ['Excited, but also really scared', 'Calm, since he’d directed Josh before',
                'Scared, since Josh is hard to work with'], a: 0,
      cue: '「very cool」のあと、続けて言う気持ち。',
      line: 'not only work with him, but then *direct him*… was *very cool but also very scary* for me',
      said: '「演出まで任され、すごく楽しみで、すごく怖くもあった。幸い彼はいい人」。',
      mean: 'cool と scary を but also で並べる。',
      trap: 'easy で気楽、scary で Josh が難しい人、と取りやすい。気持ちは but also の前後で。',
      use: 'It was exciting, but also a little scary.（わくわくしたけど、ちょっと怖くもあった）' },

    // why: disagrees ← the double negative ("wouldn't be wrong") parsed as a denial; hurt ← the Japanese frame:
    //   criticism by others heard as a sore point
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'unprof', seg: [235.8, 245.1],
      stem: 'When the speaker mentions being called unprofessional, what is their stance?',
      choices: ['They agree, and laugh at their own habit', 'They disagree, since laughing keeps things relaxed',
                'They feel hurt that people would say so'], a: 0,
      cue: '「unprofessional」のあと、「wrong」の前の語。',
      line: 'Some might call that being unprofessional and *they wouldn’t be wrong*',
      said: '「すぐ笑ってしまう。プロ失格と言う人もいるだろうし、それは正しい」。',
      mean: 'wouldn’t be wrong ＝「その通り」。弱点を笑って認めている。',
      trap: '否定が二つ重なると反論に聞こえやすい。not wrong ＝ right と置きかえる。',
      use: 'People call me picky. They’re not wrong.（細かいと言われる。その通り）' },

    // R drop: s3 ("they wouldn't be") — 65 % blind (the stock "and they wouldn't be wrong"), and it turned on a2's
    //   point and line; s1 stays as the sound item. Deleted.
    // R fix: S4: the segment started inside "wouldn't". Now 241.75 s, between "be" and "wrong".
    { id: 'x2', skill: 'dict', level: 'B2', point: 'together', seg: [241.75, 245.1],
      stem: 'Type what the speaker says: “It’s really hard for me to ___.” (3 words)', answer: 'keep it together',
      cue: '「really hard for me to」のあと。',
      line: 'it’s really hard for me to *keep it together*',
      said: '「笑いをこらえるのが本当に難しい」と言っている。3語がひと続きに聞こえる。',
      mean: 'keep it together ＝ 平静を保つ。ここでは笑いをこらえること。',
      trap: 'keep の p と it がつながり「キーピッ」、it の t も弱い。3語で書く。',
      use: 'Just keep it together until the meeting ends.（会議が終わるまで平静でいて）' },

    // R fix: V2, blind 65 %: "compares their past to a school" told the reader it's a metaphor, which ruled out the
    //   literal distractor. The stem now just names the moment.
    // R fix: V2 (blind 65 %, second pass) — the key was the only non-literal reading. "Acting classes" becomes "as
    //   close as classmates", a second figurative reading that "different years" rules out.
    // why: same school ← the metaphor taken literally; classmates ← "same high school" heard as closeness, with "at
    //   different years" lost
    { id: 'i3', skill: 'infer', level: 'C1', point: 'school', seg: [256.5, 271.5],
      stem: 'When the speaker brings up high school, what do they mean?',
      choices: ['They came up in the same kids’ TV world, years apart',
                'They really went to the same school, a few years apart',
                'They feel as close as classmates who grew up together'], a: 0,
      cue: '「different years」のあと、何の思い出を話すか。',
      line: 'we *graduated the same high school* at… *different years*… where we used to shoot iCarly and Drake and Josh',
      said: '「同じ高校を違う年に卒業したみたい」と言い、昔の撮影場所の話になる、と続ける。',
      mean: '高校はたとえ。同じ子ども番組の世界で、時期をずらして育ったということ。',
      trap: 'たとえは、あとに続く具体例（撮影場所の話）で中身を確かめる。',
      use: 'Feels like we grew up in one town.（同じ町で育ったみたい）' },

    // R fix: V2 (blind 55 %) — the key was the only reversal. "Someone else's idea" becomes the same reversal the other
    //   way round, so the order must be heard.
    // why: weaker ← "not great" taken at face value (謙遜); brag then modest ← the two halves heard in the wrong order
    { id: 'h1', skill: 'humor', level: 'B2', point: 'amazing', seg: [280.5, 284.9],
      stem: 'In the show clip about a “last idea”, what makes the line funny?',
      choices: ['It sounds modest, then turns into a brag', 'It admits the idea is weaker than the rest',
                'It sounds like a brag, then turns modest'], a: 0,
      cue: '「not great」のあと、もう一言。',
      line: 'Now my last idea, it’s actually *not great*. *It’s amazing*.',
      said: '「最後のアイデアは、実はすごくない。最高なんだ」と言っている。',
      mean: '「すごくない」で謙遜に見せて、さらに上の言葉で裏返す。自慢の前ふり。',
      trap: '日本語の謙遜の感覚だと not great で止めて聞きやすい。次の一言まで待つと意味が反転する。',
      use: 'It’s not good. It’s perfect.（いいどころか、完璧）' },

    // R fix: V2, blind 50 %: "Softly" was the only nuanced reading, and "as a rule they never break" was an
    //   absolute only a distractor had. That one becomes "Jokingly", which "if I'm being honest" rules out.
    // R fix: V2 (blind 55 %, second pass) — "Jokingly" was easy to drop. Now "Bluntly", "if I'm being honest" heard
    //   as a license to be blunt, which "sort of… slight" refutes.
    // why: unsure ← the softeners read as doubt (迷い); bluntly ← "if I'm being honest" heard as ずばり言う
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'aversion', seg: [292.2, 298.1],
      stem: 'How does the speaker frame the dislike of reboots?',
      choices: ['Softly, so the opinion doesn’t sound harsh', 'Unsurely, as if still making up their mind',
                'Bluntly, since they’re being honest'], a: 0,
      cue: '「aversion」の前後の、小さな言葉。',
      line: 'I always *sort of* have a *slight* aversion to reboots, *if I’m being honest*',
      said: '「正直、リブートってちょっと苦手」と前置きしている。',
      mean: 'sort of、slight、if I’m being honest で否定を和らげる。',
      trap: 'ぼかす語は「迷い」、honest は「ずばり」に聞こえやすいが、always で考えは決まっている。',
      use: 'I’m sort of not a fan, honestly.（正直、ちょっと苦手かな）' },

    // R fix: V2, blind 75 %: in a promo featurette the only choice that praises this show is the key. Now two
    //   choices praise it; the new one takes "it wasn't trying to reinvent" as "nothing changed".
    // R fix: V2 (blind 70 %, second pass) — the key was the only "rarely… but this one" choice. The "nothing changes"
    //   choice now has that shape too ("stayed the same"), so what made it work must be heard.
    // why: usually work ← the "but" heard without the aversion before it; stayed the same ← "wasn't trying to reinvent
    //   what the show first was" heard, "age up the characters… new stakes" lost
    { id: 'g3', skill: 'gist', level: 'B2', point: 'reboot', reveals: ['aversion'], seg: [292.2, 344.35],
      stem: 'In the part about reboots, what is the overall view?',
      choices: ['Reboots rarely work, but this one found a way', 'Reboots usually work, and this one is no exception',
                'Reboots rarely work, but this one stayed the same'], a: 0,
      cue: '前半の「aversion」と、後半でこの番組を語る部分。',
      said: '「リブートは少し苦手。でもこの番組は登場人物を大人にして、うまく新しくした」と話す。',
      mean: '一般論で否定し、but のあとでこの番組を例外としてほめる。',
      trap: 'reinvent しなかった、だけだと「何も変えない」に聞こえる。age up は変化の話。',
      use: 'Not big on sequels, but this one works.（続編は苦手だけど、これはいい）' },

    // R fix: V2 (blind 70 %) — next to a reboot-wary speaker, "forget it" was easy to drop. Now "remember it as
    //   better than it was", the nostalgia reading of "fall in love with the show".
    // why: share later ← "marry" taken literally (結婚 → family); better than it was ← "the time… they fall in love"
    //   heard as rose-tinted memory
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'marry', seg: [296.6, 304.35],
      stem: 'What does the speaker say people do with the time they first loved a show?',
      choices: ['They get stuck on it and want it kept that way', 'They share it later with their own families',
                'They remember it as better than it really was'], a: 0,
      cue: '「people」のすぐあと、少し変わった動詞。',
      line: 'people *marry themselves to* the time in which they fall in love with the show',
      said: '「人は、番組を好きになった時代に自分を結びつけてしまう」と言っている。',
      mean: 'marry oneself to ～ ＝ ～に強くこだわる。だから変化を嫌う。',
      trap: 'marry を文字通り「結婚」と取ると家族の話に引かれる。to ～ とセットで聞く。',
      use: 'Don’t marry yourself to the first plan.（最初の案にこだわりすぎないで）' },

    // R fix: V2, blind 50 %: the key was the only success and the only choice echoing the line ("really hard"), so
    //   "a show that really works" pointed straight at it. All three are now kinds of thing, none echoes the line.
    // R fix: V2 (blind 60 %, second pass) — "a risky experiment" was weak. Now "a secret formula", alchemy read as a
    //   recipe that can be followed, which "hard to recapture" refutes.
    // why: flash of inspiration ← lightning = ひらめき; formula ← alchemy = 調合, a method you can repeat
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'lightning', seg: [303.4, 312.05],
      stem: 'How does the speaker describe a show that really works?',
      choices: ['A rare mix of luck that is hard to repeat', 'A flash of inspiration from out of nowhere',
                'A secret formula that can be followed again'], a: 0,
      cue: '「alchemy and」のあと、何かをびんに入れる言い方。',
      line: 'some sort of like *alchemy and lightning in a bottle*… it’s really hard to *recapture that magic*',
      said: '「魔法や、びんに閉じこめたいなずまのようなもので、取り戻すのは難しい」。',
      mean: 'lightning in a bottle ＝ めったに起きない成功。',
      trap: 'いなずまは「ひらめき」、alchemy は「作り方」に聞こえるが、recapture が手がかり。',
      use: 'That team was lightning in a bottle.（あのチームは奇跡みたいなものだった）' },

    // why: late teens ← -teen/-ty; late 30s ← "early 30s" is the last number heard, shifted up
    { id: 'n2', skill: 'number', level: 'B1', point: 'ages', seg: [332, 341.25], keep: true,
      stem: 'Besides younger viewers, who else does the speaker think the show can reach?',
      choices: ['People in their late teens or early 20s', 'People in their late 20s or early 30s',
                'People in their late 30s or early 40s'], a: 1,
      cue: '「younger audience but then」のあと。',
      line: 'people who are in their *late 20s or early 30s* who loved the show originally',
      said: '昔この番組を好きだった20代後半から30代前半の人も楽しめる、と言う。',
      mean: 'late 20s ＝ 20代後半、early 30s ＝ 30代前半。',
      trap: 'twenties と thirties は語尾が似ている。late と early で範囲をつかむ。',
      use: 'Most of us are in our early thirties.（ほとんど30代前半です）' },
  ]
};
