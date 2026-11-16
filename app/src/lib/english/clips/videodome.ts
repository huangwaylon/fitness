// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 3
// Q: the clip's punchline is that the store now lives off adult videos (title: "Ron loves the adult video store").
//   No item tests those lines, and g2 words the outcome neutrally. Keep the clip, or skip it under GUIDE §2?
// “Ron loves the adult video store | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Leslie plans to save the failing Pawnee Video Dome with historical landmark status; Ron calls it a bailout at the
// council meeting, the public comments turn into people asking for money, and the reopened store makes its money
// from the part of the business Leslie never meant.
// Segments from the captions, words from whisper (2026-11-16). Whisper's times are rounded to whole seconds, so every
// segment follows the captions. Talk ends at ≈ 289 s.
// Names said: Leslie (“Councilwoman Knope”), Ron (“Mr. Swanson”), Andy, Dennis (the owner). Who asks Leslie about
// Rashomon, who says “online” twice and who answers “I'd call the police” are never named; no key depends on them.
// Overlaps 2S2KT_ejmJ4 (“Video Dome's Raunchy Bailout”, unbanked) at 0–64 s and 249–289 s; the council meeting
// (64–249 s) is only here. The film names (Tarkovsky, Pixar, Michael Bay, Rashomon) are never keyed on.
// Untested on purpose: 22–34 s (the slam-poetry aside, partly visual), 124–132 s's “slitting its throat” wording
// beyond i2, 176–183 s (“art house movie bull crap”), and the closing porn-shop lines (281–289 s), which only g2's
// outcome touches, in neutral words.
// Long segments on purpose: h1 (64.3–88.6 s: the story has to reach its “point”) and h2 (207–246 s: the party's
//   attack on handouts and its own request for a loan both have to be in the replay).
// EAR CHECK: 186.9 s x1 — “see myself out” linked (myself‿out); both sources agree on the words
// EAR CHECK: 204.4 s s1 — “I'd” shrinks before “call” (both sources: “I'd call the police”)
// EAR CHECK: 240.5 s x2 — “hit some” linked, the t of “hit” dropped (both: “has hit some hard times”)
import type { Clip } from '../types.ts';

export const videoDome: Clip = {
  id: 'videodome', video: 'MrZTHXtpZYM', title: 'Ron loves the adult video store', dur: 314, wpm: 168,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): the key was the only plan to save the store, and the only two-part choice. Now
    //   three plans, each with a reason in the words.
    // why: Ron buying ← Ron talks the most about it, as if he had a stake; city buys ← "save your store" and "the
    //   government" heard as the city taking it over
    { id: 'g1', skill: 'gist', level: 'B2', point: 'deal', reveals: ['landmark', 'afloat'], seg: [0, 64.2],
      stem: 'What is the opening scene mainly about?',
      choices: ['Leslie’s plan to save the store, plus advice', 'Leslie’s plan to have the city buy the store',
                'Ron’s plan to buy the store from its owner'], a: 0,
      cue: '最初の提案と、最後のアドバイス。',
      said: 'レスリーが店を史跡にして税を軽くする案を出し、ロンは反対。店主には人気作をそろえるよう助言する。',
      mean: '店を救う計画と、その条件（客が見たい映画を置くこと）が場面の中心。',
      trap: 'ロンの反対が目立つが、彼は店の当事者ではない。誰が誰に何を勧めるかで追う。',
      use: 'Here’s my plan, but there’s a catch.（計画はこう。でも条件がある）' },

    // why: city loan ← "save your store" heard as the city lending money (loans come up later); publicity ← a
    //   "landmark" sounds like free advertising
    { id: 'd1', skill: 'detail', level: 'B1', point: 'landmark', reveals: ['afloat'], seg: [0, 10.45],
      stem: 'What could the store get from the Historical Society’s decision?',
      choices: ['A tax break big enough to help', 'A loan from the city to help', 'Free publicity to help business'],
      a: 0,
      cue: 'then you might get のあと。',
      line: 'you might get enough of a *tax break* to keep your business afloat.',
      said: '「史跡に指定されれば、税の優遇で店を続けられるかも」と提案する。',
      mean: 'tax break ＝ 税の軽減。break は「休み」でなく「優遇」。',
      trap: 'save your store から「市がお金を貸す」と考えやすい。助けの中身は then のあと。',
      use: 'Is there a tax break for that?（それ、税金の優遇ある？）' },

    // R fix: V2 + S3 (blind 55 %, right): the cue said "keep", a word only the key had, and the key was the only
    //   "save" reading. Now three "Let it…" outcomes; the cue no longer names a key word.
    // why: grow ← "afloat" (浮かぶ) heard as business picking up; clear its debts ← "tax break" heard as money that pays
    //   off what it owes
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'afloat', reveals: ['landmark'], seg: [0, 10.45],
      stem: 'What does Leslie say the tax break could do for the business?',
      choices: ['Let it grow bigger and busier than now', 'Let it stay open instead of closing',
                'Let it clear all its debts in one go'], a: 1,
      cue: 'tax break のあと、文の最後の1語。',
      line: 'to *keep your business afloat*.',
      said: '「税の優遇で店を続けられるかも」と言う。',
      mean: 'afloat ＝ 浮いている。keep ... afloat で「沈まない＝つぶれずにやっていく」。',
      trap: '「浮かぶ」から景気よく伸びる話と取りやすい。afloat は沈まずに続くこと。',
      use: 'We’re barely staying afloat.（なんとかやっていけてる程度）' },

    // R fix: V2 (blind 60 %, right): "worries about the cost" was thin. "Doubts a tax break is enough" now
    //   borrows "enough of a tax break" from the line before.
    //   + S4: the end cut into “Well” (13.40 s); now [10.0, 13.38].
    // why: likes it ← "sounds like" heard as a soft, hedged first reaction; not enough ← "enough of a tax break" just
    //   before, so the objection is heard as practical
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'meddling', seg: [10.0, 13.38],
      stem: 'How does Ron react to Leslie’s plan?',
      choices: ['He likes it, as long as it costs little', 'He doubts a tax break is enough to help',
                'He objects to the city stepping in at all'], a: 2,
      cue: 'sounds like のあと、government に付く動詞。',
      line: 'That sounds like *the government meddling* in private enterprise.',
      said: '「それは政府が民間の商売に口出しすることに聞こえる」と言う。',
      mean: 'meddle ＝ 余計な手出しをする。悪い意味の語で、計画そのものに反対している。',
      trap: 'sounds like は柔らかく聞こえるが、続く語が強い否定。中身の動詞で判断する。',
      use: 'Please don’t meddle in my business.（私のことに口出ししないで）' },

    // R fix: S4: the start cut “Well” (13.40 s) and the end “intellectual” (22.14 s); now [13.95, 22.7].
    // why: praising ← "we all know how much you love" taken as a compliment; granting ← the line heard as conceding his
    //   point before her own
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'freemarket', seg: [13.95, 22.7],
      stem: 'When Leslie mentions Ron’s love of the free market, what is she doing?',
      choices: ['Teasing him about a view she knows well', 'Praising him for holding firm views',
                'Granting his point that the market should decide'], a: 0,
      cue: 'the free market の前と、続く But。',
      line: '*We all know how much you love* the free market. *But*…',
      said: '「自由市場が大好きなのはみんな知ってる。でも…」と続ける。',
      mean: 'we all know how much you love ～ は、相手のおなじみの主張を軽くからかう言い方。',
      trap: '褒め言葉や同意に聞こえやすいが、すぐ But で返す。本題はそのあと。',
      use: 'We all know how much you love Mondays.（月曜大好きなのは知ってるよ）' },

    // R fix: S4: the end cut “out” (40.92 s); now [35.15, 41.0].
    // why: not honest ← "snuff" unknown, and "failure" heard as a moral failing; not trying ← "not up to" heard as effort
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'snuff', seg: [35.15, 41.0],
      stem: 'What is Ron saying about the store owner?',
      choices: ['He isn’t good enough at what he does', 'He isn’t honest enough to be trusted', 'He isn’t trying hard enough to succeed'], a: 0,
      cue: 'failure のすぐあと、言い換えの一文。',
      line: 'This man is a failure. He is *not up to snuff*.',
      said: '「この男は失敗者だ。基準に達していない」と言う。',
      mean: 'up to snuff ＝ 水準に達している。not が付いて「力不足」。やや古風。',
      trap: 'snuff を知らないと、努力や正直さの話と取りやすい。直前の failure の言い換えと考える。',
      use: 'Is the hotel up to snuff?（ホテル、ちゃんとしてる？）' },

    // R fix: S4: the start cut “you” (46.50 s); now [46.45, 50.5].
    // why: costs more ← "heat" heard as a bill (heating), and money comes next; nervous ← "heat" as pressure felt inside
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'heat', seg: [46.45, 50.5],
      stem: 'What does Leslie warn Dennis about?',
      choices: ['The plan may cost the city a bit more', 'He may feel a bit nervous at first',
                'Some people may criticize the plan'], a: 2,
      cue: 'a little のあと、okay で念を押す前。',
      line: 'You may get *a little heat* for this, okay?',
      said: '「少し批判されるかもしれない。だからお金は賢く使って」と念を押す。',
      mean: 'get heat for ～ ＝ ～で批判を浴びる。だから「賢く使って」と続く。',
      trap: 'heat を暖房代や緊張と取りやすい。直後の「だから賢く使って」が意味を決める。',
      use: 'I took some heat for that decision.（あの決定で批判された）' },

    // R fix: V2 (blind 50 %, right): the apology choice had no reason in the scene. It now apologizes for her "No"
    //   to his film idea.
    //   + S4: the start fell inside “people want to see” (53.16 s); now [53.4, 64.2].
    // why: an apology ← right after her "No. Like Pixar", "hurt" heard as sorry for turning him down; the cost ← money
    //   was just mentioned, so the films sound expensive
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'hurt', seg: [53.4, 64.2],
      stem: 'Before naming her last suggestion, what is Leslie doing?',
      choices: ['Saying sorry for turning his idea down', 'Warning him that he won’t like the idea',
                'Warning him that the films cost a lot'], a: 1,
      cue: '最後の提案の前置きと、相手の返事。',
      line: '*I know this is gonna hurt*, but maybe some Michael Bay. — What? No, no.',
      said: '字幕付きの映画を挙げる店主に「違う。つらいだろうけど…」と人気作を勧める。',
      mean: '相手が嫌がる提案の前置き。店主の「えっ、いや」が受け止め方を示す。',
      trap: 'hurt から謝罪と取りやすい。but の前の前置きは、聞きたくない話の予告。',
      use: 'This might sting, but hear me out.（ちょっと痛いけど聞いて）' },

    // R fix: V2 (blind 50 %, right): the two distractors were vague. Now each is a concrete misreading of the story.
    //   The long segment stays (the "point" has to come at the end).
    // why: broke a window ← "I threw a rock" and "it exploded" behind the store; trouble out back ← kids in the alley
    //   behind the store sound like a problem the store has
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hornet', seg: [64.3, 88.6],
      stem: 'What makes Andy’s story about the store funny?',
      choices: ['Its lesson is about hornets, not the store', 'He admits his rock broke a store window',
                'It shows kids made trouble behind the store'], a: 0,
      cue: 'the point のあと、どんな教訓が来る？',
      line: 'The point is, obviously, *you do not throw rocks at a hornet’s nest*.',
      said: '店の裏でハチの巣に石を投げた話をして、「教訓：巣に石は投げるな」。',
      mean: '店を守る話のはずが、教訓は当たり前すぎて店と無関係。obviously が的外れさを強める。',
      trap: '店の裏の話なので関係ありそうに聞こえる。the point is のあとを聞く。',
      use: 'The point is, we’re all here now.（要するに、みんなここにいるってこと）' },

    // R fix: V2 (blind 55 %, right): "Asks Andy to explain" didn't fit the words. It now asks what the story had to
    //   do with anything, the natural reaction.
    // why: agreeing ← "also" heard as adding to Andy's lesson (the Japanese 「そうそう」 frame); asking ← after an odd
    //   story, the usual next move is to ask what it meant
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'point', reveals: ['hornet'], seg: [81.95, 96.6],
      stem: 'Right after Andy’s story, what does Leslie’s next sentence do?',
      choices: ['Adds a second lesson to Andy’s hornet one', 'Asks Andy what his story had to do with it',
                'Uses his words to steer back to the store'], a: 2,
      cue: 'Andy の言葉をそのまま借りた出だし。',
      line: '*And the point is also that* the Pawnee Video Dome is a place with tremendous community value',
      said: 'アンディの「要するに」を受け、「そして要するに、この店は地域の宝」と続ける。',
      mean: '相手の言い方を借りて、話を本題に引き戻している。脱線を責めずに戻す手。',
      trap: 'also から教訓への同意と取りやすい。also のあとに何が来るかで判断する。',
      use: 'Anyway, back to the main point.（とにかく、本題に戻ると）' },

    // R fix: V2 (blind 50 %, right): the key was the only two-part, concrete choice. All three now give a stance on
    //   the failing business and a reason.
    // why: heal ← "giving food" heard as his advice (the line taken the wrong way round); may bite ← a "wounded animal"
    //   heard as a danger to others
    { id: 'i2', skill: 'infer', level: 'C1', point: 'animal', seg: [116.0, 129.05],
      stem: 'What does Ron’s comparison with a wounded animal mean?',
      choices: ['Let a failing business die, and use what’s left', 'Keep a failing business alive until it can heal',
                'Stay away from a failing business; it may bite'], a: 0,
      cue: 'instead of のあと、何をするべきだと言う？',
      line: 'like giving food to a mortally wounded animal *instead of* … *properly utilizing its meat and pelt*.',
      said: '「つぶれた店を支えるのは、死にかけた動物に餌をやるようなもの。肉と毛皮を使え」。',
      mean: '助からないものは終わらせ、残りを役立てよ、という主張。',
      trap: 'giving food だけ聞くと「助けよう」に聞こえる。instead of のあとが本当の主張。',
      use: 'Instead of fixing it, let’s replace it.（直すより、替えよう）' },

    // why: shares the love ← asking about a favorite part usually shows warm interest; a tip ← "favorite part" heard as
    //   asking for a recommendation
    { id: 'r3', skill: 'pragma', level: 'C1', point: 'rashomon', seg: [141.6, 151.35],
      stem: 'When Leslie is asked about her favorite part, what is the question doing?',
      choices: ['Showing the asker loves the film too', 'Asking her to recommend it to someone',
                'Checking if she has seen the film at all'], a: 2,
      cue: '質問への彼女の答え、最初の一言。',
      line: 'What was your favorite part? — *I haven’t rented it, actually, yet*',
      said: '「どこが好き？」に「実はまだ借りてない。借りられる場所があるのがいい」と答える。',
      mean: '感想を聞くふりで、本当に見たのかを試している。答えで、見ていないことがばれる。',
      trap: '普通は興味の表れだが、ここは主張を確かめる質問。答えの actually に注目。',
      use: 'Oh, you’ve read it? What did you think?（読んだの？どうだった？）' },

    // why: landmark form ← the store's landmark status was the topic; online ← tools online comes up right after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'form', seg: [164.9, 171.2],
      stem: 'What does the hardware store owner ask?',
      choices: ['How to apply for the bailout money', 'How to get landmark status too', 'How to sell his tools online'],
      a: 0,
      cue: 'Is there a のあと、何を書くのか。',
      line: 'Is there a *form I need to fill out for the bailout*?',
      said: '金物店の店主が「救済の申し込み書類はある？」と聞く。',
      mean: 'fill out a form ＝ 書類に記入する。自分の店にもお金を、という申し込み。',
      trap: '史跡の話が続いたので landmark の申請と取りやすい。最後の語 bailout を聞く。',
      use: 'Do I need to fill out a form?（書類の記入は必要ですか）' },

    // R fix: V2 (blind 50 %, right): "correcting a word he misheard" was weak. It's now a refusal reading of "We're
    //   not bailing anyone out".
    // why: no money ← "not bailing anyone out" taken literally, as a plain denial; can't qualify ← the same line heard
    //   as turning his store down
    // anchor: 171.3–176.1 s "We're not bailing anyone out" swapped for "receiving historical landmark status", while at
    //   0–10 s the status means a tax break and at 221–225 s she has told the store "how they are going to spend their
    //   money"
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'label', reveals: ['form'], seg: [164.9, 176.4],
      stem: 'When Leslie answers the hardware store owner, what is she doing?',
      choices: ['Renaming the help so it sounds better', 'Telling him no money is involved at all',
                'Telling him his store can’t qualify for it'], a: 0,
      cue: 'bailout を避けて選んだ別の言い方。',
      line: '*We’re not bailing anyone out*. Pawnee Video Dome is receiving *historical landmark status*.',
      said: '「救済なんてしていない。ビデオドームは史跡の指定を受けるの」と答える。',
      mean: '中身は税の優遇というお金の助けだが、bailout という悪い響きの語を避け、聞こえのいい名前に言いかえている。',
      trap: '否定文を文字どおり「お金は出ない」と取りやすい。後で彼女自身が「お金の使い道」を指示したと言う。',
      use: 'It’s not a price rise. It’s an update.（値上げじゃなくて改定です）' },

    // R fix: S4: the end cut “it” (189.06 s); now [184.75, 189.2].
    { id: 'x1', skill: 'dict', level: 'B1', point: 'seeout', seg: [184.75, 189.2],
      stem: 'Type what the man says as he leaves: “I’ll just — I’ll ___.” (3 words)', answer: 'see myself out',
      cue: 'how did you get back in のあと、本人の返事。',
      line: 'I’ll just — I’ll *see myself out*. Don’t worry about it.',
      said: '「なぜまた入ってきた？」に、「自分で出ます、お構いなく」と答える。',
      mean: 'see myself out ＝ 見送りは不要、自分で帰ります。帰り際の決まり文句。',
      trap: 'myself out がつながり「マイセルファウ」に近い。塊で覚える。',
      use: 'Thanks. I’ll see myself out.（どうも。自分で帰ります）' },

    // R fix: S4: the start cut “about it” (189.06 s); now [189.2, 193.85].
    // why: $300 ← "three" heard with "hundred"; $13,000 / $30,000 ← three, thirteen and thirty blur at speed
    { id: 'n1', skill: 'number', level: 'B1', point: 'loan', seg: [189.2, 193.85],
      stem: 'How much money does the man say he needs?',
      choices: ['$300', '$3,000', '$13,000', '$30,000'], a: 1, keep: true,
      cue: 'I need のあと、最後に minimum が付く額。',
      line: 'I need *three thousand dollars* minimum.',
      said: '「お金を配ってると聞いた。最低3000ドル要る」と言う。',
      mean: 'three thousand ＝ 3000。minimum は「最低でも」。あとでもう一度言う。',
      trap: 'three と thirteen、thirty は似て聞こえる。-teen は長く強い。',
      use: 'We need ten people minimum.（最低10人は必要）' },

    // R fix: S4: the end cut “police” (207.00 s); now [193.6, 207.2].
    // why: hospital ← "serious physical harm" heard as an illness or injury to pay for; a threat ← "one of your
    //   citizens" heard as someone he will hurt
    { id: 'i4', skill: 'infer', level: 'C1', point: 'harm', reveals: ['loan', 'police'], seg: [193.6, 207.2],
      stem: 'What do the man’s questions after being refused suggest?',
      choices: ['He needs the money for a hospital bill', 'He owes money to people he can’t report',
                'He plans to hurt someone unless he’s paid'], a: 1,
      cue: '「警察を呼ぶ」への返事。',
      line: 'unless he got $3,000. — I’d call the police. — *You cannot call the police*.',
      said: '断られると「市民がひどい目にあうとしたら？」と聞き、「警察は呼べない」と言う。',
      mean: '払わないと痛めつけられ、警察にも頼れない。危ない相手への借金を遠回しに言っている。',
      trap: 'physical harm から治療費と取りやすい。「警察は呼べない」が鍵。',
      use: 'Let’s just say I owe some people money.（まあ、借りがある相手がいてね）' },

    // R fix: S4: the end cut “police” (207.00 s); now [197.1, 207.2].
    // why: I'll ← the dark l and the d both shrink to almost nothing; I call ← the d lost before "call"
    { id: 's1', skill: 'sound', level: 'B2', point: 'police', seg: [197.1, 207.2],
      stem: 'Fill the gap in the reply: “___ the police.”',
      choices: ['I’d call', 'I’ll call', 'I call'], a: 0,
      cue: 'What would you do if への返事。',
      line: '*I’d call* the police.',
      said: '仮定で聞かれ、「警察を呼ぶ」と答える。',
      mean: 'would の質問には I’d で答える。d は call の前でほぼ聞こえない。',
      trap: 'I’d と I’ll は短く似ている。質問が would の仮定なら、答えも I’d が自然。',
      use: 'What would you do? — I’d say no.（どうする？—断るかな）' },

    // R fix: V2 (blind 55 %, right): the Leslie choice had no hook. Now it's the near miss "even her critics took
    //   help", which vindicates her but isn't a joke on her.
    //   + S4: the start cut “police” (207.00 s); now [207.2, 218.95].
    // why: Leslie ← the speech attacks her handouts, so the joke seems aimed at her; the welfare office ← "nobody ever
    //   helped me" heard as a real complaint about a system that failed him
    // anchor: 215.2–218.9 s "I was on food stamps, I was on welfare, and nobody ever helped me" in one breath: the help
    //   he names is the help he denies
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'welfare', seg: [207.2, 218.95],
      stem: 'In the Liberty or Die speaker’s complaint, who is the joke on?',
      choices: ['Leslie, since even her critics once took help', 'The welfare office, which failed to help him',
                'The speaker, who denies help he just named'], a: 2,
      cue: '並べた2つの制度と、最後の一言。',
      line: 'I was on *food stamps*, I was on *welfare*, and *nobody ever helped me*.',
      said: '「政府のばらまきはひどい」と言い、「食料配給も生活保護も受けたが、誰も助けてくれなかった」。',
      mean: '食料配給も生活保護も、まさに政府の助け。本人は気づかず、自分の主張を自分で崩している。',
      trap: '矛先はレスリーなので、彼女が笑われていると聞きやすい。例と結論が合わないとき、笑われるのは話し手。',
      use: 'I never eat sweets. Except cake. And cookies.（甘い物は食べない。ケーキとクッキー以外）' },

    // R fix: V2 (blind 60 %, right): "will now back Leslie's plan" was easy to rule out. It's now the expected script
    //   (the party asks for cuts). The long segment stays: the attack and the request both have to be in it.
    //   + S4: the start cut “police” (207.00 s); now [207.2, 246.1].
    // why: the town is broke ← "hard times" heard as the town's; asks for cuts ← the party's usual line, as if "loan"
    //   were missed
    { id: 'h2', skill: 'humor', level: 'C1', point: 'party', reveals: ['hardtimes', 'welfare'], seg: [207.2, 246.1],
      stem: 'Why does the last public comment get a laugh?',
      choices: ['The party asks for the kind of help it attacked', 'The party asks the town to cut its spending',
                'The party says the town has hit hard times'], a: 0,
      cue: '話している団体の名前と、少し前の主張。',
      line: 'The Pawnee chapter of the *Liberty or Die party* … could *loan us some money*.',
      said: '少し前に「政府のばらまきはひどい」と言った党の支部が、「町からお金を借りられないか」と頼む。',
      mean: '施しを批判した同じ党が、すぐ自分たちのために助けを求める。言行不一致が笑い。',
      trap: '苦しいのは町だと取りやすいが、主語は党の支部。誰の苦境かを主語で追う。',
      use: 'Practice what you preach.（人に言うなら自分もやれ）' },

    // why: check every bill ← "blank check" heard as her promising to check the spending; a loan ← loans were just
    //   asked for
    { id: 'd3', skill: 'detail', level: 'B1', point: 'instructions', seg: [218.95, 225.8],
      stem: 'How does Leslie answer the “blank check” complaint?',
      choices: ['She will check every bill the store pays', 'She has told the store how to spend it',
                'The money is only a loan to be paid back'], a: 1,
      cue: 'I have given のあと。',
      line: 'I have given *specific instructions* … about *how they are going to spend their money*.',
      said: '「白紙小切手じゃない。使い道は具体的に指示した」と答える。',
      mean: 'blank check ＝ 好きに使えるお金。それへの反論。',
      trap: 'check から「確認する」と取りやすい。blank check は「白紙の小切手」の決まった言い方。',
      use: 'They gave him a blank check.（好きにやっていいと任された）' },

    // R fix: S4: the start cut “comments” (236.16 s); now [236.6, 242.2].
    { id: 'x2', skill: 'dict', level: 'B2', point: 'hardtimes', seg: [236.6, 242.2],
      stem: 'Type what the party has done: “The Pawnee chapter … has ___.” (4 words)', answer: 'hit some hard times',
      cue: 'party has のあと、つながる4語。',
      line: 'The Pawnee chapter of the Liberty or Die party has *hit some hard times*',
      said: '「党の支部は苦しい時期にある」と切り出す。',
      mean: 'hit hard times ＝ 苦境に陥る。hit some が「ヒッサム」とつながる。',
      trap: 'hit の t が消え、hit some が一語に聞こえやすい。hard times を手がかりに前を戻す。',
      use: 'The restaurant hit hard times last year.（その店は去年苦しくなった）' },

    // R fix: V2 (blind 60 %, right): "closes anyway" was refuted by the title and the mood. All three now survive.
    // why: customers stay away ← her shock heard as the plan failing; popular films ← Dennis's "give the people what
    //   they want" echoes her own advice
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['advice'], seg: [248.8, 289.6],
      stem: 'How does Leslie’s plan for the store turn out?',
      choices: ['It survives, but few customers come back', 'It survives by renting the films she named',
                'It survives, but not the way she hoped'], a: 2,
      cue: '店主が「何に」お金を使ったか。',
      said: '店主は「古い外国映画を処分し、昔から売れる部門に回した」と言い、レスリーは青ざめる。',
      mean: '店は生き残ったが、大人向けビデオの店になった。市の助けが思わぬ形で実ったオチ。',
      trap: '「客の欲しい物を」は彼女の助言どおりに聞こえるが、彼女は「これは違う」と言う。',
      use: 'Well, that backfired.（あーあ、裏目に出た）' },

    // R fix: V2 (blind 55 %, right): "lying" was a filler. It's now "twisted her words on purpose", a near miss that
    //   "right?" (sincere, checking) settles.
    //   + S4: the start cut “was” (266.58 s); now [266.75, 279.6].
    // why: ignored her ← the "dusty old foreign films" gone sounds like he threw out her plan; on purpose ← "right?"
    //   heard as a smug dig at her
    // anchor: 266.8–276.7 s "I took your advice… Give the people what they want, right?" — "This isn't what people
    //   want!": her words from 50–53 s ("popular films that people want to see") come back with a meaning she never meant
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'advice', reveals: ['outcome'], seg: [266.75, 279.6], retired: true,
      stem: 'When Dennis says he took Leslie’s advice, what’s the joke?',
      choices: ['He ignored her advice and did as he liked', 'He twisted her words on purpose to tease her',
                'He followed her words, not what she meant'], a: 2,
      cue: '店主の締めの一言と、彼女の言い返し。',
      line: 'I took your advice… *Give the people what they want*, right? — This isn’t what people want!',
      said: '「助言どおり古い外国映画を処分した。客の欲しい物を、でしょ？」と得意げ。',
      mean: '「人が見たい映画を」という彼女の言葉を、彼は文字どおり実行した。言葉は守り、意図は外した笑い。',
      trap: '外国映画の処分を、助言の無視と取りやすい。本人は right? と、彼女の言葉どおりだと確かめている。',
      use: 'You said “anything.” So I got pizza.（「何でも」って言ったからピザにした）' },
  ]
};
