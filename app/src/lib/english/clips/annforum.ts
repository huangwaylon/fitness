// “The day Leslie fell in love with Ann | Parks and Recreation” (the official Parks and Recreation channel, Season 1):
// at a public forum Ann asks the parks department to deal with a dangerous pit; Leslie's co-host flirts with her,
// Leslie pinky-promises to fill the pit and build a park, and tells the camera it could be her Hoover Dam.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–36 s (citizens' rants; whisper has an
// obscene quote at 34–37 s), 63–71 s (applause; “But I'm here to talk…” is whisper only), 77–89 s (whisper loops one
// garbled line; only the captions have the developer and the condos), 125–128 s (innuendo). Ann is named in both
// sources (“I'm Ann Perkins”); the co-host is never named after the intro, so stems call him “the co-host”.
// REVIEW 2026-11-16: pass 3, fix 19, drop 0, new 0; ear checks 0
// REVIEW: the x1 and s1 ear checks are gone (both sources agree on “get this thing fixed” and “we're gonna”;
//   rubric addendum). Open: m1 and t2 stay near 50 % blind, since “but anyway” and Leslie's zeal are easy to guess.
import type { Clip } from '../types.ts';

export const leslieAnnForum: Clip = {
  id: 'annforum', video: '-IFoOpnyDN0', title: 'The day Leslie fell in love with Ann', dur: 250, wpm: 169,
  band: 'mid', tags: ['お願い・断り', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, the key was the only positive reading; the distractors are now a tolerate reading and a tune-out
    //   reading of the same line
    // why: put up with ← "caring" heard as a reason to tolerate the shouting (the 〜けど / 我慢 frame); tune out ←
    //   "what I hear" taken literally, as if she stops listening
    // anchor: 36.8–46.4 s “members of a community that care about where they live, so what I hear… is people caring
    //   loudly at me”: “so” ties the shouting to caring, and “what I hear” means how she takes it
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'loudly', seg: [36.4, 47], retired: true,
      stem: 'Which plain-English version keeps what Leslie means about being yelled at?',
      choices: ['“When people shout at me, I hear that they care.”', '“People care, so I put up with being shouted at.”',
                '“When people shout, I tune out and stop listening.”'], a: 0,
      cue: '「so」の前の理由と、最後の造語っぽい言い方。',
      line: 'so *what I hear* when I’m being yelled at is *people caring loudly* at me.',
      said: '町を思う人たちだから、怒鳴られても「大声で気にかけてくれている」と聞こえる、と言う。',
      mean: 'what I hear は受け取り方。怒鳴り声を関心の証拠と言いかえる、前向きな解釈。',
      trap: '「怒鳴られる」が耳に残ると我慢や不満の話に聞こえる。what I hear is… は耳でなく解釈の話。',
      use: 'What I hear is that you care.（つまり、気にかけてるってことだよね）' },

    // R fix: V2/S2, the stem quoted the line under test and "go on" was a filler; now a keep-it-short near miss
    // why: thanks ← "Thank you so much" taken at face value, as if he had made a point; keep it short ← a polite
    //   thank-you heard as a hint to wrap up, though he never gets past his first sentence
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'barry', seg: [47, 56],
      stem: 'When the host answers Barry, what is happening?',
      choices: ['She is cutting him off before he gets going', 'She is thanking him for the point he made',
                'She is asking him to keep his comment short'], a: 0,
      cue: 'お礼が来るタイミングと、すぐあとの「anyone」。',
      line: 'I have a few things I want to say about… — *Thank you so much*, Barry. Always great to have you here. *Anyone else*…?',
      said: 'バリーが話し始めた瞬間にお礼を言い、ほかの人を募る。',
      mean: '中身を聞く前のお礼は、話を打ち切る合図。司会の角の立たない締め方。',
      trap: 'Thank you をお礼と取ると「良い意見」に聞こえる。直後の Anyone else が終了の合図。',
      use: 'Thanks so much. Anyone else?（ありがとう。ほかにどなたか？）' },

    // R fix: V2, "dangerous pit" against two weak asks; the park choice (Leslie's offer, g2's key) is now a builder
    //   choice
    // why: injuries ← "nurse" + "broke both his legs" suggests medical costs; the builder ← the developer who dug
    //   the basement and went bankrupt is in her story (captions), in the wrong relation
    { id: 'g1', skill: 'gist', level: 'B1', point: 'ask', reveals: ['owned'], seg: [56, 165],
      stem: 'What does Ann want from the forum?',
      choices: ['For the city to fix a dangerous hole on its land', 'For the city to pay for her boyfriend’s injuries',
                'For the city to go after the builder who dug it'], a: 0,
      cue: '最後の「bottom line」のあとで言い切る頼み。',
      line: 'it’s ugly and it’s dangerous and it’s government owned and *you need to do something about it*.',
      said: '空き地の大きな穴で彼が足を折った、何か月も放置されている、市が何とかして、と訴える。',
      mean: '彼のけがは例で、頼みは市の土地の穴を何とかすること。',
      trap: '看護師やけが、業者の話が続くので、補償や業者の責任の話に聞こえる。最後の要求の一文で決める。',
      use: 'You need to do something about it.（何とかしてください）' },

    // R fix: V2, the plan choice was the only one tied to "good idea"; all three are now readings of what she came for
    // why: a question ← the forum opened with "answer any and all of your questions"; praising ← "Excellent" heard as
    //   agreement that the lot is something good
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'idea', seg: [69, 78.6],
      stem: 'When Ann answers “No, it’s a problem”, what is she correcting?',
      choices: ['The idea that she’s pitching a project', 'The idea that she’s asking a question',
                'The idea that she’s praising the lot'], a: 0,
      cue: '直前の「Excellent」のあとの一言。',
      line: 'Excellent. That sounds like a *good idea*. Tell us about that. — *No, it’s a problem*.',
      said: '空き地の話と言うと「いいアイデアですね」と返され、「いえ、問題なんです」と直す。',
      mean: '話題を提案と受け取られたので、苦情だと言い直している。',
      trap: 'Excellent を「良い話」への相づちと取りやすい。No は直前の good idea への返事。',
      use: 'No, it’s more of a complaint.（いえ、どちらかというと苦情です）' },

    // why: twenty ← "twelve" and "twenty" share the tw- start; six ← "six" is heard later (six years); two ← "a year"
    //   swallowed after "almost"
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', seg: [89, 92.5],
      stem: 'How long has the pit been there?',
      choices: ['Two months', 'Six months', 'Twelve months', 'Twenty months'], a: 2, keep: true,
      cue: '「almost a year」のすぐあとの言い直し。',
      line: 'it’s been there for *almost a year*. — *Twelve months*.',
      said: '穴はもう1年近く、12か月そのまま。',
      mean: 'almost a year を twelve months と言い直して、長さを強調している。',
      trap: 'twelve と twenty はどちらも tw で始まる。twelve は最後が「ルヴ」で短く終わる。',
      use: 'It’s been like this for almost a year.（もう1年近くこのままです）' },

    // R fix: V2, the stem's "job" pointed at money; all three choices are now about his music or his care
    // why: his shows ← katakana サポート = 応援, a fan at his gigs; looks after him ← "broke both his legs" comes
    //   right after, so support sounds like care
    { id: 'i1', skill: 'infer', level: 'C1', point: 'support', seg: [93.6, 99.3],
      stem: 'When Ann describes her boyfriend, what does her aside suggest?',
      choices: ['She pays the bills while he plays music', 'She backs his music by going to his shows',
                'She looks after him now that he’s hurt'], a: 0,
      cue: '「musician」の直後、actually で始まる一言。',
      line: 'my boyfriend, who is a musician, *actually, I support him*.',
      said: '「彼はミュージシャンで、実は私が養っている」と付け足す。',
      mean: 'support someone ＝ 生活費を出す。actually で「稼ぎはない」と匂わせる。',
      trap: 'サポートを「応援」と取りやすい。人が目的語の support は、お金の話のことが多い。',
      use: 'I’m supporting myself now.（今は自分で生活してるよ）' },

    // R fix: V2/S2, the stem quoted the marker under test; the new-topic filler is now a cause reading
    // why: caused by ← "but" heard as tying the job to the fall; apologizes ← "but" heard as walking back the remark
    //   (the 前言撤回 frame)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', reveals: ['support'], seg: [93.6, 101.8],
      stem: 'What does Ann’s two-word link before the fall do?',
      choices: ['It drops a side remark and goes back to her point', 'It shows the fall was caused by his music job',
                'It apologizes for the remark about his job'], a: 0,
      cue: '彼の仕事の話と、穴に落ちた話のつなぎ目。',
      line: 'actually, I support him. *But anyway*, he fell in and broke both his legs.',
      said: '彼の仕事の話を少しして「まあそれはいいとして」と、穴に落ちた話に戻る。',
      mean: 'but anyway ＝ 脱線を切り上げて本題に戻る合図。',
      trap: 'but を前言の取り消しやおわびと取りやすい。脱線のあとの but anyway は「本題に戻る」合図。',
      use: 'But anyway, where was I?（まあそれはいいとして、何の話だっけ）' },

    // R fix: V2, "free to date" named the flirting outright
    // why: who cares for him ← "You have to take care of him" comes soon after; near the pit ← the pit is "nearby my
    //   house", so where she lives sounds relevant
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hitting', seg: [101.6, 112.2],
      stem: 'Why does the co-host ask about Ann’s living situation?',
      choices: ['To see whether she might be available', 'To see who will look after him now',
                'To see how close she lives to the pit'], a: 0,
      cue: '穴の話から、二人の関係の質問に変わるところ。',
      line: 'this guy, is it *pretty serious*? Are you guys *living together*?',
      said: '穴の件を確かめたあと、「真剣な仲？一緒に住んでる？」と彼氏との関係を聞く。',
      mean: '本題と関係ない交際の質問。相手がいるかを探っている。',
      trap: 'けがの話のあとなので介護の確認に聞こえる。pretty serious は二人の仲を聞く言い方。',
      use: 'So, is it serious with him?（で、彼とは真剣なの？）' },

    // why: not busy ← "going on" read as plans (予定); poor ← "didn't have a lot" heard as money
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'goingon', seg: [114.6, 121.9],
      stem: 'What does the co-host suggest about the boyfriend’s life before the fall?',
      choices: ['It wasn’t going very well even then', 'He didn’t have many plans or events',
                'He didn’t have much money even then'], a: 0,
      cue: '「to start with」の前の言い回し。',
      line: 'this guy sounds like he *didn’t have a lot going on for him* to start with.',
      said: '「もともと冴えない人みたい。そこへ両足骨折」と言う。',
      mean: 'have a lot going for someone ＝ 良い点が多い。否定で「冴えない人」。',
      trap: 'going on を「予定」と取ると忙しさの話になる。for him が付くと良い点の話。',
      use: 'She has a lot going for her.（彼女はいいところがたくさんある）' },

    // R fix: V2, the key was the only negative reaction; the distractors are now nuanced too
    // why: flattered ← being hit on read as welcome attention she hides; not sure ← her question heard as a real
    //   request for facts
    { id: 't1', skill: 'attitude', level: 'B2', point: 'surprise', reveals: ['hitting'], seg: [128.3, 133],
      stem: 'How does Ann react to the co-host’s advice?',
      choices: ['She can’t believe he’s doing this here', 'She is flattered but plays it cool',
                'She is not sure what he’s getting at'], a: 0,
      cue: '「actually」と「right now」の二つの語。',
      line: 'Are you *actually* hitting on me *right now*?',
      said: '「今ここで、本気で私を口説いてるの？」と聞き返す。',
      mean: 'actually と right now で「この場で？信じられない」とあきれている。',
      trap: '口説かれる場面は喜びとも取れるが、right now は「よりによって今」の驚き。',
      use: 'Are you actually serious right now?（今それ本気で言ってる？）' },

    // R fix: V2, "single" can't be a denial, so the key stood out; now three ways of being taken
    // why: getting married ← "married" caught but the form before it lost; seeing someone ← another "I'm taken"
    //   excuse
    { id: 'd1', skill: 'detail', level: 'B1', point: 'married', seg: [131.2, 135.4],
      stem: 'What does the co-host say about himself when he denies it?',
      choices: ['That he is already married', 'That he is getting married', 'That he is seeing someone'], a: 0,
      cue: '「I’m not hitting on you」のすぐあと。',
      line: 'No, I’m not hitting on you. *I’m actually married*.',
      said: '「口説いてない。実は結婚してるんだ」と答える。',
      mean: '結婚していることを、口説いていない理由として出している。',
      trap: 'married だけ拾うと婚約中とも迷う。I’m actually のすぐあとが married なら、もう結婚している。',
      use: 'I’m actually married, so no.（実は結婚してるので、ごめんね）' },

    // R fix: V2/K3, "his wife is in the room" was never said (absurd); both distractors now come from the scene
    // why: insults ← "he's just weak", before this stretch, heard as the joke; blames Ann ← the usual "you gave me
    //   the wrong idea" script, which he never uses
    { id: 'h1', skill: 'humor', level: 'C1', point: 'denial', reveals: ['married', 'hitting'], seg: [133.8, 148.75],
      stem: 'Why is the co-host’s explanation funny?',
      choices: ['Each excuse he adds makes the flirting plainer', 'He insults the boyfriend while claiming to be kind',
                'He blames Ann for giving him the wrong idea'], a: 0,
      cue: '「I’m not」のあとに並ぶ言葉の中身。',
      line: 'I’m not hitting on you… I’m very comfortable around women, *attractive women*… Maybe we can just *exchange numbers*.',
      said: '口説いてないと言いつつ、「魅力的な女性には慣れてる」「番号を交換しよう」と続ける。',
      mean: '否定の直後に口説き文句が増えていく。言い訳が自分の本音をばらしている。',
      trap: '否定の言葉だけ追うと話が見えない。否定のあとに何を足すかで本音が分かる。',
      use: 'Not that I’m complaining, but…（文句じゃないけど…）' },

    // R fix: V2, "gets back to the pit" was the only choice that kept her on task; now two choices return to the
    //   complaint and differ only in yes / brush-off
    // why: says yes ← "I'd love to do it" taken at face value; sharp no ← "Look" heard as anger
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'love', seg: [152.3, 158.6],
      stem: 'How does Ann answer the co-host’s offer of a weekend away?',
      choices: ['She waves it off and returns to her complaint', 'She says yes, then returns to her complaint',
                'She turns him down sharply in front of everyone'], a: 0,
      cue: '「I’d love to」のすぐあとに来る言葉。',
      line: 'Look, *I’d love to do it*. *The bottom line is*, I’ve been trying…',
      said: '「ええ、ぜひ。で、要するに、何か月も直してもらおうとしてるの」と本題に戻る。',
      mean: 'I’d love to をさらっと流して話を戻すのは、やんわりした「結構です」。',
      trap: 'I’d love to は本当の承諾にも使う。すぐ本題に戻るなら、受け流しの合図。',
      use: 'I’d love to, but let’s focus.（ぜひ、でも今は本題を）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fixed', seg: [154.1, 158.4],
      stem: 'Type what Ann says: “I’ve been trying to ___ for months.” (4 words)', answer: 'get this thing fixed',
      cue: '「bottom line is」のあと、短い語が続くところ。',
      line: 'I’ve been trying to *get this thing fixed* for months',
      said: '「何か月も、これを直してもらおうとしている」。',
      mean: 'get＋物＋過去分詞で「〜してもらう」。thing は穴をさすくだけた言い方。',
      trap: 'get の t と this がつながり「ゲディス」に近い。fixed の ed も弱く短い。',
      use: 'I need to get my phone fixed.（スマホを直してもらわないと）' },

    // R fix: V2, only the key said "government"; now all three do
    // why: hired ← "developer" and "government" both heard, in the wrong relation; let it be built ← government +
    //   condos heard as a permit story
    { id: 'd2', skill: 'detail', level: 'B2', point: 'owned', seg: [158.3, 164.8],
      stem: 'What reason does Ann give that the pit is the city’s job?',
      choices: ['The land is owned by the government', 'The builder was hired by the government',
                'The government let the condos be built'], a: 0,
      cue: '「ugly」「dangerous」に続く三つ目。',
      line: 'it’s ugly and it’s dangerous and it’s *government owned*',
      said: '「見苦しいし、危ないし、市の土地なんだから」と理由を並べる。',
      mean: 'government owned ＝ 公有地。だから市が責任を持つべき、という理屈。',
      trap: 'government だけ拾うと「市の業者」に聞こえる。owned まで聞くと土地の持ち主の話。',
      use: 'Is this place privately owned?（ここは私有地ですか）' },

    // R fix: V2, a parks department filling a pit was guessable; the distractors now use her real plan's first step
    //   and Ann's story
    // why: report back ← "go to that location tomorrow" heard as the whole plan; fence off ← "dangerous" and
    //   "condos" from Ann's story
    { id: 'g2', skill: 'gist', level: 'B1', point: 'plan', seg: [166.1, 201],
      stem: 'By the end of the forum, what does Leslie offer to do?',
      choices: ['Fill in the pit, then build a park on it', 'Go and see the pit, then report back',
                'Fence off the pit until the condos are done'], a: 0,
      cue: '「tomorrow」のあとに続く二つの計画。',
      line: 'we will *fill in that pit*, and then when that’s done… *put a park* on the land.',
      said: '明日現地に行って穴を埋め、そのあと公園を作ると約束する。',
      mean: '頼まれた修理だけでなく、公園づくりまで約束している。',
      trap: '「明日現地に行く」で止めると、見に行くだけに聞こえる。and then when that’s done のあとに次の計画。',
      use: 'And when that’s done, we’ll celebrate.（それが済んだら、お祝いしよう）' },

    // R fix: V2, the key was the only sincere choice; each choice now names a move the words settle. S4: the seg
    //   ended before "tomorrow" (190.9 s)
    // why: teasing ← "pinky promise" is a children's word; cautious ← "we, I will help you" stumbles, heard as
    //   hedging
    { id: 't2', skill: 'attitude', level: 'B2', point: 'pinky', seg: [176.8, 191.8],
      stem: 'When Ann asks if it’s a promise, how does Leslie come across?',
      choices: ['Earnest: she ups the promise and names a day', 'Teasing: she turns the request into a game',
                'Cautious: she promises help but nothing firm'], a: 0,
      cue: '約束の言葉の重ね方と、そのあとの予定。',
      line: 'It’s *more than a promise*. It’s a *pinky promise*… I will go to that location *tomorrow*.',
      said: '「約束以上。指切りよ。みんなに指切りする」と言い、明日行くと続ける。',
      mean: '子どもの約束の言葉をわざと使い、全員に向けて重ねる。本気度の強調。',
      trap: '子どもの言葉なので冗談に聞こえる。言葉を重ねて具体的な予定まで言えば本気。',
      use: 'I promise. Pinky promise.（約束する。指切りね）' },

    // R fix: V2, "we'll go and" was a filler, so it's now "we gotta"; N7: the stem holds g2's key, so it reveals plan
    // why: wanna ← "want to" shrinks the same way, and Leslie "wants" the park; gotta ← one sound off (-tt- / -nn-);
    //   were gonna ← a weak "we're" heard as the past
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', reveals: ['plan'], seg: [194.1, 200.4],
      stem: 'Fill the gap: “when that’s done, ___ put a park on the land.”',
      choices: ['we wanna', 'we gotta', 'we’re gonna', 'we were gonna'], a: 2,
      cue: '「done」のあと、弱くつながる3音ほど。',
      line: 'and then when that’s done, *we’re gonna* put a park on the land.',
      said: '「それが済んだら、そこに公園を作るの」。',
      mean: 'we’re gonna が「ウィアガナ」とひと続き。we’re は弱く、ほぼ「ウィア」。',
      trap: 'wanna も似た音だが「作りたい」になる。gonna は「ガ」、wanna は「ワ」で始まる。',
      use: 'We’re gonna need a bigger table.（もっと大きいテーブルが要るね）' },

    // R fix: V2, "two years" had no sound basis; "four" comes from the "for" right before
    // why: sixteen ← -teen and plain six heard alike; four ← "for" right before sounds like "four"
    { id: 'n2', skill: 'number', level: 'B1', point: 'six', seg: [207.9, 212.4],
      stem: 'How long has Leslie worked at the parks department?',
      choices: ['Four years', 'Six years', 'Sixteen years'], a: 1, keep: true,
      cue: '「parks department for」のすぐあと。',
      line: 'I’ve worked at the parks department for *six years*',
      said: '「公園課で6年働いてきた」と話す。',
      mean: '自分の経験の長さを言って、次の自慢話の前置きにしている。',
      trap: 'six と sixteen は最初が同じ。-teen なら「ティーン」と長く強く聞こえる。',
      use: 'I’ve lived here for six years.（ここに住んで6年です）' },

    // R fix: V2, "her proud work" in the stem pointed at the key; it now names the moment
    // why: gross ← "disinfect" and "cats" heard as the joke being a gross detail; shrugs off ← "problems with the
    //   cats" heard as a real danger that she treats lightly
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sandbox', seg: [207.9, 218.6],
      stem: 'Why does Leslie’s sandbox example get a laugh?',
      choices: ['It’s a small chore she sells as a big win', 'It’s a gross chore she describes in detail',
                'It’s a real danger she shrugs off as minor'], a: 0,
      cue: '「proud of」のあとに出す具体例。',
      line: 'things that I’m *proud of*. Recently I led a city-wide drive to *disinfect the sandbox sand*…',
      said: '「誇れる仕事もした。最近は、猫の件のあと砂場の砂を消毒する運動を率いた」。',
      mean: '「市全体の運動を率いた」と大きく言うが、中身は砂場の消毒。その差が笑い。',
      trap: 'cats を危険な問題と取ると真面目な話に聞こえる。大げさな語と小さな中身の差を聞く。',
      use: 'It’s small, but I’m proud of it.（小さいけど、自慢なんだ）' },

    // R fix: V2, "trouble" was far from the line; now a scope-shift near miss (the city's, not hers). N7: every
    //   choice says "this park", so it reveals plan
    // why: as hard as a dam ← "Hoover Dam" taken as a huge, difficult build ("from scratch"); the city's biggest ←
    //   scope shift, "my" missed
    // anchor: 210.5–227.9 s “things that I'm proud of… But this pit, the chance to build a whole new park… could be
    //   my Hoover Dam”: the frame is pride in her work, and “But” sets the pit above the sandbox
    // seg 19 s: the anchor needs both “proud of” and “Hoover Dam” (native-level §2 allows ≤ 25 s)
    // retired: reveals g2's point, so play 3+ under g2 drew no C2
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'dam', reveals: ['sandbox', 'scratch', 'plan'], seg: [210, 229], retired: true,
      stem: 'Which plain-English version keeps what Leslie means by her last line?',
      choices: ['“This park could be what I’m remembered for.”',
                '“This park could be the city’s biggest project ever.”',
                '“This park could be as hard to build as a dam.”'], a: 0,
      cue: '「proud」で始まる話と、「But」のあとの対比。',
      line: 'things that I’m *proud of*… *But this pit*, the chance to build a whole new park from scratch… *could be my Hoover Dam*.',
      said: '砂場の消毒を誇れる仕事に挙げ、「でもこの穴、一から公園を作るチャンスは私のフーバーダムかも」。',
      mean: '「誇れる仕事」の流れで But と比べるので、ダムは後に残る代表作のたとえ。ダムを知らなくても解ける。',
      trap: 'ダムを「大変さ」や「市の事業」と取りやすい。my と前の話の枠で読む。',
      use: 'This could be my big break.（これが私の大きなチャンスかも）' },

    // R fix: V2, "quickly and roughly" was a filler; N7: the stem names the new park, so it reveals plan
    // why: without help ← "from scratch" heard as doing it alone; no money ← "nothing" heard as no budget
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'scratch', reveals: ['plan'], seg: [219.5, 224.8],
      stem: 'How does Leslie describe building the new park?',
      choices: ['Starting it from nothing at all', 'Doing it all without any help',
                'Doing it with no money at all'], a: 0,
      cue: '「a whole new park」の直後の2語。',
      line: 'the chance to build a whole new park *from scratch*',
      said: '「一からまるごと新しい公園を作るチャンス」。',
      mean: 'from scratch ＝ ゼロから。穴を埋めた更地に、すべて新しく作る。',
      trap: 'scratch を「ひっかく」と取ると意味がつかめない。from scratch は料理でも使う「一から」。',
      use: 'I made this cake from scratch.（このケーキ、一から作ったの）' },
  ]
};
