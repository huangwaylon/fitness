// REVIEW 2026-11-17: pass 4, fix 19, drop 0, new 0; ear checks 3
// OPEN: whisper has "Prank, prank!" at 331.0 s (not in the captions), just after nt1's segment. If Chris's threat is
//   itself a prank, nt1 still holds (its key is about how the line frames the threat, not whether it's carried out).
// OPEN: a1, f1 and d2 no longer depend on who asks "do you think they'll notice?" or "have to as in must do?".
// “Carly Joins A FIGHT CLUB?! | iCarly Full Scene | NickRewind” (NickRewind, Best of iCarly): Carly and a friend walk
// into an influencer fight club, meet two fans who fight to vent about online critics, and learn a newcomer must fight
// so she can't tell; meanwhile two men try to turn Millicent off Derek, with an aging app, then a blunt story she hates.
// Carly's fight draws bets against her, and Chris turns up threatening to post the club online.
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Carly, Kelly, Elena, Millicent,
// Derek, Chris. The two men in Millicent's story and the friend who bets are never named, so items don't name them.
// Untested on purpose: 33–56 s (the topless/bottomless photo talk), 109–118 s (the "blackmailing" pun and "racist"),
// 145–155 s (whisper "Derek said, lame. Lame means cool now", captions "lame… flame means cool now"), 239–247 s (the
// swings, shown more than said), 269–306 s (the "prank prince" bit needs backstory). At 13.7 s whisper has "take a
// lab", the captions "lap", so f1's line skips it; at 87.4 s whisper has "mad-dogging my liver", the captions "mad dog
// in my liver" (same sounds; f3's line follows whisper).
// EAR CHECK: 140.6 s h2 — "No, I don't think that's right" is the other man's reply, not the girlfriend claimer backing down
// EAR CHECK: 251.4 s n3 nt2 i7 — "let's make that 200" is the voice that said "I got a hundred on Sonny" (whisper "200 on Sonny", captions "200 don't say"; captions "sunday" at 236.3 s)
// EAR CHECK: 328.3 s nt1 — "But like not in a funny way" is Chris finishing his threat, not Carly answering it
import type { Clip } from '../types.ts';

export const influencerFightClub: Clip = {
  id: 'influfight', video: 'OWa3SxApDlU', title: 'Carly Joins A FIGHT CLUB?! 🥊 iCarly Full Scene',
  dur: 346, wpm: 146, band: 'slow', tags: ['友だち', '恋愛'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: the stem named Carly as the asker, which no source settles, and "Carly is too famous" would flip if
    //   Carly is the one answering; the stem and choices now say "the speaker" and "her famous friend" (no ear check)
    // why: famous friend ← right mechanism, wrong target: the friend is the famous one, and the weak "my" is easy to
    //   lose; watching ← "Unfortunately, they will" heard as worry that someone is already watching them
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'unmissable', seg: [5.6, 12.0],
      stem: 'Asked “do you think they’ll notice?”, what does the answer show?',
      choices: ['The speaker thinks she’s far too striking to go unseen',
                'The speaker thinks her famous friend will be spotted',
                'The speaker thinks someone has been watching them all night'], a: 0,
      cue: 'unfortunately のあと、誰の存在の話か。',
      line: 'Unfortunately, they will. *My presence* in the room is *unmissable*.',
      said: '「あいにく気づかれる。私はどこでも目立つから」と答える。',
      mean: 'unmissable ＝ 見逃しようがない。困ったふりをした自慢で、話題は自分。',
      trap: '有名な連れの話と取りやすい。my のような弱い語で、誰の話かを確かめる。',
      use: 'Sorry, I’m hard to miss.（ごめん、目立っちゃうんだよね）' },

    // R fix: V2 (60 % blind: "run a lap to warm up" was the odd one out) and K2 (captions have "take a lap", so a
    //   lap is said); the key no longer rests on "lap", and both distractors now come from “lay” and “land”
    // why: lie low ← "lay" heard as lie (low), after the sneak-out talk; near the exit ← "land" heard as the ground
    //   or the way out, after "sneak out"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'land', seg: [11.9, 15.6],
      stem: 'Before anything else, what does the speaker suggest they do?',
      choices: ['Get a feel for the place before doing anything', 'Lie low until they can slip out unseen',
                'Stay on the ground floor, close to the exit'], a: 0,
      cue: '「Look, let’s just」のあと、land で終わる言い方。',
      line: 'Look, let’s just… get a *lay of the land*.',
      said: '「とりあえず様子を見よう」と提案している。',
      mean: 'get the lay of the land ＝ 場所や状況の様子をつかむ。',
      trap: 'lay を lie（横になる）、land を地面と文字通りに取ると、隠れる・出口に引かれる。固まりで覚える。',
      use: 'First day? Get the lay of the land.（初日？まず様子をつかんで）' },

    // R fix: V2 (65 % blind): "really" in the stem pointed away from the literal reading; the stem is neutral now,
    //   and both distractors are two-sided readings like the key
    // why: gruff comfort ← "Don't worry" taken at face value, the "Ugh" before it heard as gruffness; teasing ←
    //   the "Ugh" heard as a reaction to Carly's joke, so the line reads as mocking it kindly
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'kidneys', seg: [28.9, 32.4],
      stem: 'After Carly’s nervous joke, what does the fan’s “Don’t worry…” line do?',
      choices: ['Makes a threat sound like comfort', 'Offers real comfort in a gruff way',
                'Teases Carly’s joke in a friendly way'], a: 0,
      cue: '「Don’t worry」のあと、何がいらないと言うか。',
      line: 'Don’t worry. Most people don’t even need *both their kidneys*.',
      said: '「心配しないで。たいていの人は腎臓が2つもいらないから」と言う。',
      mean: '安心させる形で、「腎臓1つ分くらい痛めつける」と脅している。',
      trap: 'Don’t worry だけで安心の言葉と取りやすい。前置きのあとの中身で働きを決める。',
      use: 'Don’t worry, it only hurts a lot.（心配しないで、すごく痛いだけ）' },

    // R fix: V2 (50 % blind): "fight videos to post" was the weak one; the new near miss is Carly's own advice
    //   ("limit your comments, or even not read them"), which the pair turn down right after
    // why: face critics ← "throttle the neck of every commenter" heard as fighting the commenters themselves;
    //   stop reading ← Carly's "not read them" just after, heard as what the club does for her
    { id: 'd1', skill: 'detail', level: 'B2', point: 'vent', seg: [56.55, 68.8],
      stem: 'What does one of the pair say the fight club does for her?',
      choices: ['It lets her let off steam about online critics', 'It lets her face her online critics in person',
                'It keeps her from reading her online critics'], a: 0,
      cue: '「commenter」のあと、ここで何をして、どうなるか。',
      line: 'I can come here and just, you know, *smack somebody around*. Then *I feel better*.',
      said: '批判コメントに腹が立つと、ここで誰かを殴って気を晴らす、と言う。',
      mean: '殴る相手は誰でもよく、コメントした本人ではない。怒りのはけ口。',
      trap: 'commenter の直後なので、批判した人と戦うと取りやすい。殴る相手の語を聞く。',
      use: 'I go running to blow off steam.（走ってストレス発散してる）' },

    // R fix: V2 (50 % blind): "getting a fact wrong" broke the parallel and left "on purpose" as the one comic
    //   comeback; the new distractor is a comeback too, refuted by "it bears repeating"
    // why: forgot ← "You already said that" heard as the end of it, "obviously" missed; not listening ← "Well,
    //   obviously…" heard as a jab at Carly, as if she needed to hear it twice
    { id: 'h1', skill: 'humor', level: 'C1', point: 'repeat', reveals: ['kidneys'], seg: [75.9, 83.5],
      stem: 'What makes the second kidney line funny?',
      choices: ['She’s caught repeating herself and says it was on purpose',
                'She’s caught repeating herself and admits she forgot',
                'She’s caught repeating herself and says Carly wasn’t listening'], a: 0,
      cue: '「You already said that」への返し方。',
      line: 'You already said that. — Well, *obviously, it bears repeating*.',
      said: '同じ脅しを2回言い、指摘されると「当然、言う価値あり」と返す。',
      mean: 'うっかりを「わざと」と言いかえる開き直り。bears repeating ＝ 言う価値あり。',
      trap: 'obviously を逃すと「忘れていた」と取りやすい。認めたか開き直ったかを聞く。',
      use: 'Yes, I said it twice. It bears repeating.（2回言ったよ。大事だから）' },

    // R fix: V2 (55 % blind): "barked like an angry dog" was absurd; the new distractor is a stare too, read
    //   without the hostility (they are among fans)
    // why: knows her ← "mad-dogging" missed, a stare from a fan read as recognition; drinking ← "my liver" pulls in
    //   alcohol
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'maddog', seg: [83.5, 91.6],
      stem: 'When one of them suggests leaving, what has the woman in the corner done?',
      choices: ['Glared at her as if she wants to hurt her', 'Stared at her as if she knows her from somewhere',
                'Eyed her as if she’d had too much to drink'], a: 0,
      cue: '「wide set eyes」のあと、その人がしていること。',
      line: 'The one in the far corner… has been *mad-dogging my liver*.',
      said: '「隅の人が、ずっと私の肝臓をにらんでる」と帰りたがる。',
      mean: 'mad-dog ＝ 敵意をこめてにらみつける（スラング）。肝臓を狙われている気分。',
      trap: 'mad-dog を逃すと、ファンの視線と取りやすい。liver からお酒にも引かれる。動詞として聞く。',
      use: 'Why is that guy mad-dogging me?（なんであの人、こっちにらんでるの？）' },

    // R fix: V2 (70 % blind: the title says she joins, so "must fight" was free); all three choices now say
    //   newcomers fight, and the item turns on the stated reason
    // why: not scared ← "you have to fight" plus Kelly's challenge read as a test of nerve; fans ← "such a fan… hope
    //   I get to fight you" earlier
    { id: 'g1', skill: 'gist', level: 'B2', point: 'join', reveals: ['rule'], seg: [92.9, 109.4],
      stem: 'Why can’t Carly and her friend simply leave the fight club?',
      choices: ['Newcomers must fight, so they can’t tell anyone', 'Newcomers must fight, to show they aren’t scared',
                'Newcomers must fight, since fans came to see it'], a: 0,
      cue: '「Where do you two」のあと、新人の決まりとその理由。',
      line: 'if it’s your *first night* at Fight Club, *you have to fight*… *you must become one of us*.',
      said: '「初日は必ず戦う。誰にも言わないよう仲間になってもらう」と止められる。',
      mean: '戦えば自分も同じ立場になるので、秘密を外にもらせなくなる、という理屈。',
      trap: '度胸試しやファンの期待に見えやすい。To make sure のあとに目的が来る。',
      use: 'What happens here stays here.（ここでのことは、ここだけの話）' },

    // R fix: V2 (70 % blind, the title gives "fight"); all three choices now involve fighting, and the item turns on
    //   when and on what condition: "first night… you have to fight"
    // why: watch first ← the usual first-night script (newcomers watch, then fight); if challenged ← Kelly's "I hope
    //   I get to fight you" heard as the trigger
    { id: 'd2', skill: 'detail', level: 'B1', point: 'rule', seg: [92.9, 102.8],
      stem: 'What is the rule for someone’s first night at the club?',
      choices: ['They have to fight that same night', 'They watch one night, then fight',
                'They fight only if someone picks them'], a: 0,
      cue: '「first night」のすぐあと。',
      line: 'if it’s your first night at Fight Club, *you have to fight*.',
      said: '「初日の人は戦わなきゃいけない」と言われる。',
      mean: 'すぐに「must ってこと？」と聞き返され、その晩に戦うと念を押される。',
      trap: '初日は見学、というよくある流れを予想すると引かれる。first night と have to をつなげて聞く。',
      use: 'First time? You have to try the pie.（初めて？パイは絶対食べて）' },

    // R fix: V2 (60 % blind: "Okay, look" pointed to an obligation, and "we'd have to" was the weak one); the new
    //   distractor "we're going to" is the gonna/gotta near sound, and it fits "Okay, look" as well
    // why: get to ← gotta's flap sounds like "geta"; gonna ← "gotta" and "gonna" differ only in t/n, and both fit a
    //   plan; ought to ← "otta" is gotta without the g
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [124.9, 130.0],
      stem: 'Fill the gap: “Okay, look, ___ be brutal and honest.”',
      choices: ['we get to', 'we’ve got to', 'we’re going to', 'we ought to'], a: 1,
      cue: '「look」のすぐあと、主語に続く短い音。',
      line: 'Okay, look, *we’ve got to* be brutal and honest',
      said: '「容赦なく正直にいかないと」。got to が縮んでいる。',
      mean: 'we’ve got to ＝ we have to。’ve はほぼ消え、got to は「ガラ」。',
      trap: 'get to（〜できる）も「ゲラ」と似る。母音の「ア」と「エ」で聞き分ける。',
      use: 'I’ve got to go, sorry.（もう行かなきゃ、ごめん）' },

    // why: Derek's date ← "like a date" and "fun date" are Millicent's words; project ← "How's the project going?"
    //   opens their talk with her
    { id: 'g2', skill: 'gist', level: 'B1', point: 'derek', seg: [124.9, 215.0],
      stem: 'In the story with Millicent, what are the two men trying to do?',
      choices: ['Get her to stop liking a boy', 'Help her get a date with a boy', 'Help her finish a school project'], a: 0,
      cue: '最初の作戦会議、Millicent の名前のあと。',
      line: 'I can *convince Millicent not to like Derek*.',
      said: '「Derek を好きにならないよう説得できる」と作戦を立てる。',
      mean: 'アプリも Derek の話も、彼女の気持ちを離すための作戦。',
      trap: 'date や project は Millicent の言葉。not to like の not は弱く消えやすい。',
      use: 'Can you talk me out of buying this?（これ買うの、やめさせて）' },

    // why: taking it back ← the reply heard as the same man backing down; years ← "in years" just before, so
    //   "that's not right" sounds like correcting the number
    { id: 'h2', skill: 'humor', level: 'C1', point: 'girlfriend', seg: [129.7, 142.3],
      stem: 'Why is the reply “No, I don’t think that’s right” funny?',
      choices: ['It flatly denies a plain fact about his life', 'It is him quietly taking back his own claim',
                'It corrects how many years he has been single'], a: 0,
      cue: '「right now」のあと、誰が何を否定しているか。',
      line: 'I literally have a girlfriend *right now*. — *No, I don’t think that’s right.*',
      said: '「今まさに彼女がいる」と言う相手に、もう一人が「いや、それは違うと思う」と返す。',
      mean: '本人の生活の事実を、友だちが平然と否定する。話のずれが笑いになる。',
      trap: 'in years の直後なので年数の訂正と取りやすい。否定は直前の発言に向くことが多い。',
      use: 'Wait, I don’t think that’s right.（待って、それは違うと思う）' },

    // R fix: V2 (55 % blind: the key was the only positive choice); "nervous" became a positive near miss that
    //   reads "but" as a wish, refuted by "So a fun date"
    // why: let down ← "but schoolwork" heard as a complaint and "fun date" as sarcasm; wishes it were real ← pleased,
    //   but "but schoolwork" kept as a regret, with the "so" conclusion missed
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'fundate', seg: [155.8, 161.8],
      stem: 'When Millicent ends with “so a fun date”, how does she feel about it?',
      choices: ['Excited, since schoolwork makes it even better', 'Let down, since schoolwork makes it less of a date',
                'Pleased, though she wishes it were a real date'], a: 0,
      cue: '「but schoolwork」のあと、so でつなぐ結論。',
      line: 'It’s going to be like a date, but schoolwork. *So a fun date*.',
      said: '「デートみたいなものだけど勉強つき。だから楽しいデート」と言う。',
      mean: 'but で弱点を言うと思わせて、勉強があるから「もっと楽しい」とつなぐ。本気の喜び。',
      trap: 'but のあとは不満、という型で皮肉と取りやすい。so の結論が本音を決める。',
      use: 'Work, but with free pizza. So, fun work.（仕事だけどピザつき。楽しい仕事）' },

    // R fix: schema: the answer's curly apostrophe failed the app's /^[a-z']+…$/ check; it is a straight one now
    { id: 'x1', skill: 'dict', level: 'B2', point: 'help', seg: [166.6, 171.6],
      stem: 'Type what he says: “I ___, and I uploaded Derek’s picture.” (3 words)', answer: "couldn't help myself",
      cue: '「when you get older」のあと、I に続く3語。',
      line: 'I *couldn’t help myself*, and I uploaded Derek’s picture.',
      said: '「我慢できなくて、Derek の写真を入れちゃった」。',
      mean: 'can’t help myself ＝ ついやってしまう。言いわけしつつ楽しんでいる。',
      trap: 'couldn’t の t が消えて could に聞こえやすいが、could では意味が逆。',
      use: 'Sorry, I couldn’t help myself.（ごめん、つい）' },

    // R fix: V2 (50 % blind): "a joke she doesn't find funny" was the weak one; the new near miss reads the aging
    //   app literally, refuted by her "grow old together"
    // why: won't stay handsome ← "Woof. Am I right?" is the man's point, not hers; older than he looks ← an aging
    //   picture taken as news about Derek's age
    { id: 'i8', skill: 'infer', level: 'B2', point: 'app', reveals: ['derek'], seg: [172.8, 179.9],
      stem: 'How does Millicent take the picture of Derek as an old man?',
      choices: ['As a sign they’ll stay together for years', 'As proof Derek won’t stay handsome for long',
                'As a hint Derek is older than he looks'], a: 0,
      cue: '「Woof」のあと、Millicent の質問。',
      line: 'Aw, does this mean you think we’re going to *grow old together*? *Do me next.*',
      said: '「これって、私たちが一緒に年を取るってこと？私のもやって」と喜ぶ。',
      mean: '老けた Derek を見せて冷めさせる作戦が、逆に二人の未来の話になってしまった。',
      trap: 'Woof（うわ、ひどい）は見せた側の感想。答えは、相手が実際にどう返したかで決める。',
      use: 'Does this mean we’re friends now?（これって、もう友だちってこと？）' },

    // why: mother ← "his mother" heard as the one who objects; project ← the school project they share, and "do
    //   whatever he says" heard as Derek doing the work
    { id: 'd3', skill: 'detail', level: 'B2', point: 'overheard', seg: [195.8, 203.2],
      stem: 'What does he say he overheard Derek telling his mother?',
      choices: ['That he is only being nice to get his way', 'That his mother doesn’t want him to date her',
                'That he would rather do the project alone'], a: 0,
      cue: '「his mother」のあと、that 以下。',
      line: 'he was *just being nice* to you to *get you to do whatever he says*.',
      said: '「Derek は言うことを聞かせたくて優しいだけ、と母親に話してた」と伝える。',
      mean: 'just being nice ＝ 優しいのは「ふり」。',
      trap: 'mother が聞こえるので母親の反対と取りやすい。that のあとが Derek の言葉。',
      use: 'He’s just being nice to get a ride.（車に乗せてほしくて優しいだけ）' },

    // R fix: V2 (50 % blind: "blames her for not listening" had no footing in the words); the new distractor is the
    //   sincere reading, refuted by "I'm the hero here"
    // why: sorry ← "earlier" in the Japanese frame (もっと早く言えば = an apology); feels bad ← "I thought you should
    //   know" heard as sympathy for her, the boast missed
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'hero', seg: [203.2, 207.1],
      stem: 'Right after “We thought you should know”, what does the next line do?',
      choices: ['It claims the credit for wanting to tell her', 'It says sorry for not telling her sooner',
                'It shows how bad he feels about the news'], a: 0,
      cue: '「earlier」のあと、自分をどう呼ぶか。',
      line: 'I thought you should know *earlier*. *I’m the hero here.*',
      said: '「僕はもっと早く言うべきだと思ってた。ヒーローは僕だ」と付け足す。',
      mean: 'we を I に言い直し、早く言おうとしたのは自分だと手柄を取る。',
      trap: '日本語の「もっと早く言えば」は謝罪になりやすい。I’m the hero で自慢と分かる。',
      use: 'For the record, I said this first.（言っとくけど、最初に言ったのは私）' },

    // R fix: V2 (55 % blind: "upset" was the only negative-at-them choice, the sitcom script); "doesn't believe them"
    //   became "upset with Derek, not them", refuted by "You've ruined my life"
    // why: thankful ← the Japanese frame: bad news told for your sake gets a thank-you; upset with Derek ← the news is
    //   about Derek, so the anger is heard as aimed at him
    { id: 'a6', skill: 'attitude', level: 'B1', point: 'ruined', seg: [207.1, 211.2],
      stem: 'How does Millicent react to what they tell her?',
      choices: ['She is upset with them for telling her', 'She is thankful, though sad about him',
                'She is upset with Derek, not with them'], a: 0,
      cue: '最初の「Why」で始まる質問と、次の一言。',
      line: '*Why the heck would I want to know?* You’ve *ruined my life*.',
      said: '「なんで知りたいと思うわけ？人生めちゃくちゃよ」と言う。',
      mean: '怒りは Derek でなく、教えた二人に向いている。知りたくなかった、ということ。',
      trap: '教えてもらったらお礼、という流れを予想しやすい。Why would I ～? は「〜するわけない」。',
      use: 'Why would I want to know that?（そんなこと知りたくないよ）' },

    // why: get back at him ← "scratch out" heard as damage aimed at Derek; in secret ← "you've ruined my life" heard as
    //   anger at the messengers only, so she'd stay with Derek
    { id: 'i9', skill: 'infer', level: 'C1', point: 'initials', seg: [209.2, 215.3],
      stem: 'What does Millicent’s last line suggest about her and Derek?',
      choices: ['It’s over, and she’d been very serious about him', 'It’s over, and she plans to get back at him',
                'It’s not over, and she’ll keep seeing him in secret'], a: 0,
      cue: '最後の文、何をどこから消すか。',
      line: 'Now I have to go *scratch out our initials* from *a lot of trees*.',
      said: '「たくさんの木から二人のイニシャルを消しに行かなきゃ」と言う。',
      mean: '別れるつもりだと分かる。木に「たくさん」彫っていたほど、本気だった。',
      trap: 'scratch out を仕返しと取りやすいが、消すのは二人の印。a lot of の量が気持ちの強さ。',
      use: 'Now I have to delete all our photos.（二人の写真、全部消さなきゃ）' },

    // R fix: N7: the trap note names the later 200 (n3's key); reveals now lists 'twohundred'
    // why: two hundred ← the raise said later; a thousand ← the hundred/thousand swap
    { id: 'n2', skill: 'number', level: 'B1', point: 'hundred', reveals: ['twohundred'], seg: [233.6, 238.0], keep: true,
      stem: 'How much has the cheering friend bet on the fight?',
      choices: ['A hundred', 'Two hundred', 'A thousand'], a: 0,
      cue: '「I got」のすぐあと。',
      line: 'I’m rooting for you, Carly. I got *a hundred* on…',
      said: '「応援してるよ。100賭けてるけど」。',
      mean: 'I got 100 on ～ ＝ 〜に100賭けてる。got a は「ガラ」とつながる。',
      trap: 'あとの200と混ざりやすい。数字はその場で聞く。thousand なら「サウ」が聞こえる。',
      use: 'I’ve got twenty bucks on the Giants.（ジャイアンツに20ドル賭けてる）' },

    // R fix: V2 (60 % blind): "really" in the stem pointed away from the cheering; the stem is neutral now
    // why: win the money ← "rooting for you" + "a hundred" heard as a bet on Carly; just for show ← "you're all fake"
    //   at the end, heard as a staged fight
    { id: 'i7', skill: 'infer', level: 'C1', point: 'rooting', reveals: ['hundred'], seg: [233.6, 238.0],
      stem: 'Judging by the bet, how does the cheering friend think the fight will go?',
      choices: ['Carly will most likely lose', 'Carly will win them the money',
                'It will all be just for show'], a: 0,
      cue: '「a hundred on」のあとの名前と、but。',
      line: 'I got a hundred on Sonny, *but I’m rooting for you*.',
      said: '「お金は相手に賭けてるけど、応援してるよ」と言う。',
      mean: 'but が、口の応援とお金の予想が逆だと示す。本音では Carly が負けると読んでいる。',
      trap: 'rooting for you で、Carly に賭けたと取りやすい。but の前後で向きが変わる。',
      use: 'I hope I’m wrong, but I doubt it.（外れてほしいけど、たぶん無理）' },

    // R fix: V2 (50 % blind): "wants the fight stopped" had no footing in the words; the new near miss is a second,
    //   separate bet on Carly, refuted by "make *that* 200" (the same bet, changed)
    // why: a win looks possible ← right target, wrong direction: a raise heard as new faith in Carly ("Am I doing
    //   it?" taken as progress); both sides ← "200" heard as a new bet on Carly, with "that" lost
    // anchor: 236.6 s "…on Sonny, but I'm rooting for you" (the money is on the other fighter); 242.6–249.8 s
    //   "Totally hitting you… definitely gonna hit you… Am I doing it?" (no hit yet); 251.4 s "let's make that 200":
    //   "that" is the same bet, doubled
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'twohundred', reveals: ['hundred', 'rooting'], seg: [233.6, 253.6],
      stem: 'What does raising the bet tell us about the friend’s view of Carly?',
      choices: ['Watching her has made a loss look even more certain', 'Watching her has made a win look possible after all',
                'Watching her has made the friend bet on both sides'], a: 0,
      cue: '1回目の賭けと、「Am I doing it?」のあと。',
      line: 'I got a hundred on Sonny… *Am I doing it?* … Okay, *let’s make that 200*…',
      said: 'Carly は空振りばかりで、友だちは賭けを200に増やす。',
      mean: 'make that は前の賭けの言い直しで、相手に倍賭けた。言葉よりお金が本音。',
      trap: '「上げた」だけだと Carly を見直したと取りやすい。make that の対象を聞く。',
      use: 'Go team! But my money’s on them.（がんばれ！でも本命はあっち）' },

    // R fix: N7: the trap note and a distractor's why name the earlier hundred (n2's key); reveals now lists 'hundred'
    // why: a hundred and fifty ← "a hundred" from before blends in; two thousand ← the hundred/thousand swap
    { id: 'n3', skill: 'number', level: 'B1', point: 'twohundred', reveals: ['hundred'], seg: [248.5, 253.6], keep: true,
      stem: 'After Carly asks “Am I doing it?”, what does the bet become?',
      choices: ['A hundred and fifty', 'Two hundred', 'Two thousand'], a: 1,
      cue: '「let’s make that」のすぐあと。',
      line: 'Okay, let’s make that *200*…',
      said: '「よし、それ200にしよう」と賭け金を上げる。',
      mean: 'make that ～ ＝（注文や数を）〜に変える。賭けを倍にしている。',
      trap: '前の a hundred が耳に残ると、足し算に引かれる。make that のあとの数だけを聞く。',
      use: 'Actually, make that two coffees.（やっぱりコーヒー2つで）' },

    // R fix: S2 and V2 (60 % blind): the stem quoted the words that answer it; the stem now names the moment. The
    //   video distractor was co-true-ish (the exposure won't be funny), so it became a hedge reading of "like". The
    //   key no longer says the threat "is real": whisper has "Prank, prank!" at 331.0 s, after the segment
    // why: a joke too ← "in a funny way" earlier sets a joking frame, so the echo is heard as more of it; half
    //   serious ← "like" heard as a softener (みたいな), which makes the threat sound lighter
    // anchor: 316.5 s "Yeah, but like in a funny way" (his stalking passed off as a joke); 325.5 s "everyone's going
    //   to know you're all fake"; 328.3 s "But like not in a funny way": the same frame, turned around
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'funnyway', seg: [308.7, 330.4],
      stem: 'What does Chris’s very last line do to his threat?',
      choices: ['It turns his earlier line around: this part is no joke', 'It echoes his earlier line: this part is a joke too',
                'It softens the threat: he is only half serious'], a: 0,
      cue: '前の「in a funny way」と比べて。',
      line: 'Yeah, but like *in a funny way*. … everyone’s going to know you’re all fake. *But like not in a funny way.*',
      said: '「面白い感じで」と言った Chris が、最後に「面白くない感じで」と付ける。',
      mean: '同じ言い方を裏返し、冗談の枠を外す。前半は笑いでごまかし、後半は本気の脅し。',
      trap: '冗談の続きと聞くと脅しを軽く取る。同じ言い回しが戻ったら、何が逆になったかを聞く。',
      use: 'I’m kidding. But also, I’m not.（冗談だよ。でも本気でもある）' },
  ]
};
