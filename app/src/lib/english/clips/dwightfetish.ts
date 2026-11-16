// REVIEW 2026-11-16: pass 9, fix 11, drop 0, new 0; ear checks 3
//   open: h1 (blind 55 %), i2 (50 %) and nt3 (65 %, stress) kept; no stronger distractor without a second key.
//   nt3 ships only after the ear check.
// “Dwight's Fetish - The Office US” (the official The Office channel, Best of Season 9): Dwight hunts the warehouse
// vandal. His "signed drawings" request is a cover for matching handwriting to the drawing on the wall; when that
// fails, they lure Nate away with a fake "your mother is dying", bribe him with gum, and he names someone at once.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 104 s; whisper's last line (102–124 s)
// runs over music. The "fetish" is a transparent cover story, not sexual content; the stretch at 16–33 s (the
// workers' suggestions for drawing body parts: "nipple-less breasts", "cantaloupes") is untested on purpose. No number
// worth asking ("one human butt" only). "Defaced" is garbled in both sources ("who to face"), so no line quotes it.
// Speakers other than Nate are not named in the audio; no item depends on which investigator speaks.
// EAR CHECK: 102.7 s a2 — "…really rude" assumed Nate's (the turn after "there never was any gum"); whisper "That's
//   really rude", captions "it's really rude" (the line quotes only "really rude")
// EAR CHECK: 76.2 s nt2 — "You know who the vandal is" said flat, as a statement (no rise); both sources lack "do"
// EAR CHECK: 98.5 s nt3 — the stress in "there never was any gum" falls on "never" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const dwightFetish: Clip = {
  id: 'dwightfetish', video: 'hFXaqKOIw-4', title: 'Dwight\'s Fetish', dur: 124, wpm: 144, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %). "Best artist" was the odd one out; "who refuses to draw" is a test a partial listener
    //   could read into "I'm not drawing a butt" → "All right then"; refuted by "this is getting us nowhere".
    // why: hobby ← the title and "my fetish is signed drawings", taken at face value; refuse ← a worker refuses and
    //   Dwight lets it go, as if refusing were the test
    { id: 'g1', skill: 'gist', level: 'B2', point: 'purpose', reveals: ['compare', 'sign'], seg: [0.4, 46.4],
      stem: 'What is the real aim of Dwight’s paper-and-drawing plan?',
      choices: ['To work out who made the drawing on the wall', 'To collect signed drawings for a private hobby',
                'To see which workers refuse to draw at all'], a: 0,
      cue: '「up there」の推測への返事と、次の作戦の話。',
      line: 'Well, this is getting us nowhere. … We need *another approach*.',
      said: '紙を配って絵とサインを求め、趣味だと言い張る。うまくいかず「別のやり方が要る」と言う。',
      mean: '目的は、壁の絵を描いた人を突き止めること。趣味の話はごまかし。',
      trap: 'タイトルや「my fetish」をそのまま信じやすい。言い訳のあとの作戦の話が本当の目的。',
      use: 'We need another approach.（別のやり方が必要だ）' },

    // why: small business ← business = 商売, read literally; draw well ← "no one's… but my own" heard as "no one but
    //   me can"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'business', seg: [4.45, 11.0],
      stem: 'What does Dwight say about his plans for the drawings?',
      choices: ['That they’re private, so nobody should ask', 'That they’re a small business he runs alone',
                'That nobody but him could draw them well'], a: 0,
      cue: '「said drawings」のあと、文の終わりまで。',
      line: 'What I do with said drawings is *no one’s business but my own*.',
      said: '「その絵をどうするかは、私だけの問題だ」と言う。',
      mean: 'none of your business と同じ形。聞くなと先に線を引いている。',
      trap: 'business を「商売」と取りやすい。is no one’s business は「余計なお世話」の型。',
      use: 'That’s my business, not yours.（それはこっちの問題だから）' },

    // R fix: V2 (blind 55 %). "Grade them" was a weak contest reading; "take them upstairs" uses "up there" as the
    //   office upstairs (a keyword trap), so both distractors now hang on the words said.
    // why: hang them ← "up there" heard as where the drawings will go; upstairs ← "up there" heard as the office
    //   upstairs, where the bosses are
    { id: 'd1', skill: 'detail', level: 'B1', point: 'compare', reveals: ['purpose'], seg: [7.7, 11.8],
      stem: 'What does a worker guess Dwight will do with the drawings?',
      choices: ['Compare them with the ones up there', 'Hang them up there with the others',
                'Take them up to the office upstairs'], a: 0,
      cue: '「You’re gonna」のあとの動詞。',
      line: 'You’re gonna *compare* ’em to the butts *up there*.',
      said: '「上にあるお尻の絵と比べるんだろ」と、作業員が見抜く。',
      mean: '集めた絵を壁の落書きと見比べて、描いた人を探す、という推測。',
      trap: 'up there が耳に残ると「上に貼る」と取りやすい。動詞 compare と後ろの to をセットで聞く。',
      use: 'Let’s compare it to the old one.（前のと比べてみよう）' },

    // why: guess was wrong ← "Incorrect" taken at its word, so the signing must be part of the hobby; autographs ←
    //   sign = サイン, a famous person's autograph, and "signed drawings" sounds like a collection
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sign', reveals: ['compare', 'purpose'], seg: [10.9, 15.95],
      stem: 'Why is Dwight’s “Oh, also…” request funny?',
      choices: ['It gives away the very plan he just denied', 'It proves the worker’s guess was wrong after all',
                'He treats the workers’ doodles like autographs'], a: 0,
      cue: '「Oh, also」のあと、名前を書かせる理由。',
      line: 'Incorrect, it is my fetish. Oh, also *sign them*.',
      said: '「違う、私の趣味だ」の直後に「あ、名前も書いて」と付け足す。',
      mean: '名前が要るのは、絵と人を結びつけたいから。否定した目的を、自分でばらしている。',
      trap: 'サインを有名人のサインと取りやすい。言い訳のあとの付け足しは、本音が出やすい所。',
      use: 'Oh, and one more thing.（あ、それともう一つ）' },

    // R fix: V2 (blind 60 %). "Wisest" was a sound match nobody would mean; two equally sensible targets replace both
    //   distractors, so only the word settles it. Trap note rewritten.
    // why: newest ← the usual target for pressure in a group; quietest ← the one least likely to be missed, also "-est"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'weakest', seg: [36.4, 41.8],
      stem: 'Which worker do they decide to single out?',
      choices: ['The weakest one', 'The newest one', 'The quietest one'], a: 0,
      cue: '「We need to find the」のあと。',
      line: 'We need to find the *weakest one* and separate ’em from the group.',
      said: '「いちばん弱いやつを見つけて、群れから引き離す」と言う。',
      mean: '肉食動物の狩りのような言い方。群れから一人だけを引き離す作戦。',
      trap: '新入りや無口な人も「狙いやすい一人」として自然に思える。-est の前の語をしっかり聞く。',
      use: 'Let’s start with the easiest one.（いちばん簡単なのから始めよう）' },

    // R fix: V2 (blind 60 %). "Laugh and stop taking it seriously" fitted no interrogation; "break down" is the
    //   literal crack = 崩れる reading, refuted by "a pretense to talk to him" (they want words, not tears).
    // why: break down ← crack = 崩れる, read as crying; lose his temper ← crack = snap (キレる), and pressure on one man
    //   alone could end in a fight
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'crack', seg: [42.6, 46.4],
      stem: 'What do they hope will happen once they get Nate alone?',
      choices: ['He’ll give in and tell them what he knows', 'He’ll break down and start to cry',
                'He’ll lose his temper and start a fight'], a: 0,
      cue: '「Nate alone」のあと、短い動詞。',
      line: 'if we could get Nate alone, we could *crack him*.',
      said: '「ネイトを一人にできれば、口を割らせられる」と言う。',
      mean: 'crack someone ＝ 圧力をかけて白状させる。刑事ドラマでよく聞く言い方。',
      trap: '「崩れて泣く」や「キレる」と混ざりやすい。取り調べで人が目的語なら「口を割らせる」。',
      use: 'I’m starting to crack under pressure.（プレッシャーで参ってきた）' },

    // R fix: V2 (blind 50 %). "Is visiting" was the only mild one beside a dramatic key; both distractors are now
    //   urgent-sounding pretexts with the same frame "his mother is …".
    // why: waiting outside ← "mother" + "talk to him" heard as an urgent visit; on the phone ← the usual excuse to
    //   pull someone off the floor
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mother', seg: [46.7, 50.55],
      stem: 'What excuse do they plan to use to get Nate alone?',
      choices: ['Tell him his mother is dying', 'Tell him his mother is outside',
                'Tell him his mother is on the phone'], a: 0,
      cue: '「a pretense」のあと、tell him のあと。',
      line: 'We just need a *pretense*… tell him that his mother *is dying*.',
      said: '「口実が要る。母親が危ないと言えばいい」と話す。pretense ＝ 口実。',
      mean: 'ネイトを呼び出すための作り話。本当に具合が悪いわけではない。',
      trap: 'mother だけ聞くと、来客や電話など急ぎの用件を想像しやすい。is のあとの語で決まる。',
      use: 'I need an excuse to leave early.（早く帰る口実が要る）' },

    // why: playing along ← sincerity flip: "That's great. Can I talk to her?" heard as sarcasm; real health scares ←
    //   "pull through again" taken as real history, missing "pretense"
    // anchor: 47.0–51.7 s "a pretense… That usually works on him", then 64.8–71.9 s "pull through again?… Can I talk
    //   to her?… she needs her rest again": the same lie, believed again, with a sincere request to talk to her
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'again', reveals: ['works', 'mother'], seg: [47.0, 72.0],
      stem: 'What do Nate’s questions about his mother show about him?',
      choices: ['He’s fallen for this same story many times', 'He knows it’s a story and is playing along',
                'He’s used to his mother’s real health scares'], a: 0,
      cue: '「usually」と、ネイトの「again」をつなぐ。',
      line: 'That usually works on him. … So she’s gonna *pull through again*? … Can I talk to her?',
      said: 'ネイトは「また持ち直すの？よかった。話せる？」と聞き、相手は「また休んでる」と返す。',
      mean: 'again が二人の口から出て、同じ作り話を何度も信じてきたと分かる。笑われているのは、気づかないネイト。',
      trap: '「よかった」を皮肉と取りやすいが、話したいと頼むのは本気の印。前の「口実」とつなげて聞く。',
      use: 'Wait, you fell for that again?（え、またそれに引っかかったの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'works', reveals: ['again'], seg: [48.7, 52.4],
      stem: 'Type what he says next: “That ___.” (4 words)', answer: 'usually works on him',
      cue: '「is dying」のあと。最後の2語はつながる。',
      line: 'That *usually works on him*.',
      said: '「あいつにはだいたいそれが効く」と言う。',
      mean: 'work on 人 ＝ その人に効く。usually から、前にも同じ手を使ったと分かる。',
      trap: 'works on him はひと続きになり、him の h も弱い。語の切れ目を意識して書く。',
      use: 'Ice cream always works on her.（彼女にはアイスが効く）' },

    // R fix: V2 (blind 60 %). "Leaves to call his mother" was the weak one; "gets the gum he was promised" follows
    //   "give him his gum" (the script a bribe usually follows), refuted by "there's no gum".
    // why: names no one ← the gum talk read as dodging, and "give him his gum" heard as payment anyway; gets the gum ←
    //   "give him his gum" heard as the deal being kept
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['didit', 'nogum', 'ramble'], seg: [52.2, 104.5],
      stem: 'How does the talk with Nate turn out?',
      choices: ['He names someone, and the gum turns out to be fake', 'He names no one, but they give him the gum anyway',
                'He names someone and gets the gum he was promised'], a: 0,
      cue: '最後の30秒、「you can go」の前後。',
      line: '*He did it.* … There’s *no gum*, there never was any gum.',
      said: '口実で呼び出し、ガムで釣って聞くと、ネイトはすぐ名前を出す。最後に「ガムはない」と明かされる。',
      mean: 'うまく聞き出せたが、口実もガムもうそだった。',
      trap: 'ガムの話で話がそれるので、何も聞き出せなかったと思いやすい。最後の質問への返事を聞く。',
      use: 'Well, that worked.（まあ、うまくいったね）' },

    // R fix: V2 (blind 70 %). "More news about his mom" was implausible after "she needs her rest"; "keep it to
    //   himself" is a natural follow-on to bad family news, refuted by "let's talk about this mural business".
    // why: warning ← "Now listen" heard as a stern opener before trouble; keep it quiet ← "listen" right after private
    //   family news, as if asking for discretion
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'listen', reveals: ['purpose'], seg: [71.3, 76.1],
      stem: 'Right after the talk about Nate’s mother, what does “Now listen” do?',
      choices: ['It turns from the excuse to the real topic', 'It warns Nate that he’s in serious trouble',
                'It asks Nate to keep the news to himself'], a: 0,
      cue: '「Now listen」の直後に続く言葉。',
      line: '*Now listen*… let’s talk about this *mural business*.',
      said: '「さて、来たついでに壁画の件を話そう」と切り出す。',
      mean: 'Now listen は話題を変える合図。母親の話は呼び出すための口実で、ここからが本題。',
      trap: 'listen を「よく聞け」という叱る前置きと取りやすい。後ろに続く話題で働きを決める。',
      use: 'Now, about that other thing…（さて、例の件だけど）' },

    // R fix: V2 (blind 70 %). "Because they already know" was easy to reject from the stem's "said as"; replaced by a
    //   right-mechanism, wrong-target near miss (an accusation of Nate), refuted by "who the vandal is" / "Tell us who".
    // why: accuse Nate ← the flat "you know…" heard as "you did it"; ask softly ← the Japanese frame: a
    //   statement-shaped soft check (〜ですよね)
    // anchor: 76.2–77.3 s "You know who the vandal is" (statement order, no "do", in both sources), then 89.7 s "Tell
    //   us who…": they still need the name, so they don't know it; they assert what they want him to admit
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'vandal', seg: [72.0, 93.3],
      stem: 'Why is “you know who the vandal is” said as a statement?',
      choices: ['To act sure he knows, so he can’t deny it', 'To hint that they think Nate is the vandal',
                'To ask softly, without pushing him too hard'], a: 0,
      cue: '疑問の形かどうか、そして最後に何を求めるか。',
      line: '*You know who the vandal is.* … Tell us who…',
      said: '「お前は犯人を知ってる」と言い切り、あとで「誰か言え」と迫る。',
      mean: '知っている前提で言い切る取り調べの手。否定しにくくして名前を引き出す。最後に聞くので、彼らは犯人を知らない。',
      trap: '日本語の「〜ですよね」のような柔らかい確認と取りやすい。前提で言い切るのは、逃げ道をふさぐ言い方。',
      use: 'You know what I’m going to ask.（何を聞くか、分かってるよね）' },

    // R fix: V2 (blind 70 %). "Worry about his mother" was a filler; "fear of the vandal" is the snitch script,
    //   refuted by "I know… warehouse guys are your friends".
    // why: losing his job ← the interrogation script: workers fear for their jobs; fear of the vandal ← the usual
    //   reason a witness stays quiet
    { id: 'i1', skill: 'infer', level: 'C1', point: 'friends', seg: [76.1, 82.95],
      stem: 'What do they expect might stop Nate from talking?',
      choices: ['Loyalty to the guys he works with', 'Fear of losing his job if he talks',
                'Fear of what the vandal might do'], a: 0,
      cue: '「Now I know」のあと、but の前。',
      line: 'I know… warehouse guys are *your friends*, but…',
      said: '「倉庫の連中が友だちなのは分かってる。でも…」と前置きする。',
      mean: '友だちをかばうと読んでいる。I know 〜, but で事情を認め、それでも話させる。',
      trap: '職場の取り調べなら「クビが怖い」と考えがちだが、言葉にしたのは友だち。but の前を聞く。',
      use: 'I know you’re busy, but this is quick.（忙しいのは分かるけど、すぐ済むよ）' },

    // why: the ← "these" said weakly, its long vowel missed; those ← the vowel blurred; all of these ← the weak "a" of
    //   "a lot" lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'lot', seg: [76.6, 80.55],
      stem: 'Fill the gap: “Now I know ___ warehouse guys are your friends.”',
      choices: ['a lot of these', 'a lot of the', 'a lot of those', 'all of these'], a: 0,
      cue: '「Now I know」のすぐあと、まとまった数語。',
      line: 'Now I know *a lot of these* warehouse guys…',
      said: '「倉庫の連中の多くが…なのは分かってる」と言う。',
      mean: 'a lot of は一続きに軽く言われる。these は長い「イー」と、ズで終わる音。',
      trap: 'the と these は th のあとの長さで区別する。those なら「オウ」の音になる。',
      use: 'A lot of these places close early.（このへんの店は早く閉まるところが多い）' },

    // why: stalling ← off-topic talk read as a tactic to avoid naming anyone; better reward ← talk of gum flavor read
    //   as bargaining over the bribe
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ramble', reveals: ['minty', 'didit'], seg: [80.55, 93.3],
      stem: 'What does Nate’s answer to the gum offer show about him?',
      choices: ['His mind easily wanders off the point', 'He’s stalling so he won’t have to name anyone',
                'He wants a better reward than just gum'], a: 0,
      cue: '話がどこへ行くか、そして次の質問への返事。',
      line: 'but we’ve got chewing gum. — Gum’s… *mintier lately, have you noticed?*',
      said: 'ガムで釣ろうとすると、ネイトは「最近ミント強くない？」と話をそらし、聞かれるとすぐ答える。',
      mean: 'かけ引きではなく、ただ気が散っている。だからこそ、すぐに口を割る相手。',
      trap: '話がそれると「時間かせぎ」と読みやすい。そのあとすぐ答えているかで判断する。',
      use: 'Sorry, where was I?（ごめん、何の話だっけ）' },

    // R fix: S3. The cue's "too" was a word only the key had; the cue now points at the add-on after "mintier".
    // why: more flavor ← "mintier" heard as an improvement; harm his health ← "trying to hurt you" taken literally
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'minty', seg: [82.95, 89.65],
      stem: 'How does Nate feel about gum these days?',
      choices: ['Annoyed that it’s gotten too strong', 'Pleased that it’s got more flavor',
                'Worried it could harm his health'], a: 0,
      cue: '比べる -ier の語と、そのあとの言い足し。',
      line: 'some of it’s just *too minty*. It’s like they’re *literally trying to hurt you*.',
      said: '「ガムがミント強すぎ。わざと痛めつけようとしてるみたい」と言う。',
      mean: '大げさな、ただの不満。literally は強調で、本当に体が危ないわけではない。',
      trap: '-ier は「良くなった」に聞こえやすいが、too が付けば行き過ぎ。',
      use: 'This coffee is way too strong.（このコーヒー、濃すぎる）' },

    // R fix: V2 (blind 65 %). "Finally" in the stem pointed at the build-up, and "long, hard grilling" was its plain
    //   opposite. Stem trimmed; "answers a different question" (he has just rambled about gum) replaces it.
    // why: did it himself ← "He did it" heard as "I did it" (the weak h); different question ← after the gum ramble,
    //   a reply heard as still off topic
    { id: 'h2', skill: 'humor', level: 'C1', point: 'didit', seg: [85.95, 93.5],
      stem: 'When they ask who did it, why is Nate’s reply funny?',
      choices: ['All that plotting, and he names someone at once', 'He finally admits that he did it himself',
                'He still answers some other question instead'], a: 0,
      cue: '最後の質問から返事までの速さと、主語。',
      line: 'Tell us who… — *He did it.*',
      said: '「誰がやったか言え」と聞かれ、ネイトは即座に「あいつだ」と答える。',
      mean: '口実、引き離し、ガムと手をかけたのに、一言で決着。準備と結果の差が笑い。',
      trap: 'He は弱く、I did it に聞こえやすい。自白なら主語は I。脱線に引きずられず返事を聞く。',
      use: 'That was easier than I thought.（思ったより簡単だった）' },

    // why: all eaten ← "no gum" heard as none left; later on ← "give him his gum" heard as a promise kept for later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'nogum', seg: [95.0, 100.6],
      stem: 'When one man says “give him his gum”, what’s the reply?',
      choices: ['There never was any gum', 'The gum has all been eaten', 'He’ll get the gum later on'], a: 0,
      cue: '「There’s no gum」のあと、もう一言。',
      line: 'There’s no gum, there *never was any gum*.',
      said: '「ガムなんてない。最初からなかった」と返す。',
      mean: 'ガムで釣ったのも作り話。母親の話と同じ手口だった。',
      trap: 'no gum だけ聞くと「もうない・品切れ」と取りやすい。後ろの never was で「最初から」。',
      use: 'There never was a plan B.（プランBなんて最初からなかった）' },

    // why: relieved ← he has just said gum is "too minty"; amused ← the trick read as a shared joke among coworkers
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'rude', reveals: ['nogum', 'again'], seg: [97.5, 104.5],
      stem: 'How does Nate react when he hears the news about the gum?',
      choices: ['He’s offended', 'He’s relieved', 'He’s amused'], a: 0,
      cue: '最後の一言、really のあとの語。',
      line: '… *really rude*.',
      said: '「それはひどい、失礼だよ」と言う。',
      mean: 'だまされたことに腹を立てている。母親の作り話には気づかないのに、ガムでは怒る。',
      trap: 'さっき「ミント強すぎ」と言っていたので、ほっとしたと取りやすい。最後の形容詞で決まる。',
      use: 'Wow, that’s kind of rude.（うわ、それちょっと失礼）' },

    // why: on "gum" ← the noun is the topic, and nouns usually carry the stress; on "was" ← "was" heard as a contrast
    //   with "is" (there was gum, but it's gone)
    // anchor: 98.0–99.9 s "There's no gum" then "there never was any gum": the only new word in the repeat is "never"
    // retired: C2 stress item, until the ear check (the stress on “never”)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'nogum', seg: [97.5, 100.8], retired: true,
      stem: 'In “there never was any gum”, where is the stress, and why?',
      choices: ['On “never”: the gum was a lie from the start', 'On “gum”: as opposed to some other reward',
                'On “was”: there had been gum, but it’s gone'], a: 0,
      cue: '前の文とくらべて、強く長く聞こえる語。',
      line: 'There’s no gum, there *never* was any gum.',
      said: '「ガムはない」と言ってから、「最初からなかった」と言い足す。',
      mean: 'くり返しの中で新しい情報は never だけ。そこに強勢が来て「今だけでなく、ずっと」と広げ、約束がうそだったと示す。',
      trap: '名詞に強勢が来ると思いやすいが、くり返した語は弱くなる。強勢は新しく足した語に来る。',
      use: 'I never said that. Not once.（そんなこと一度も言ってない）' },
  ]
};
