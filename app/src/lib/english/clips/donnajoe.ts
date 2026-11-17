// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 2
// Q: nt2's replay (177.4–195.7 s) plays Donna's "all we do is have sex… have sex again" list. No item tests it. Keep?
// Q: nt1 (25 s) and nt2 (18 s) are longer than 15 s, because the evidence spans the ex-wives story and the "boring"
//   line. Kept as they are; clips.test.ts doesn't test the length.
// “Donna's ex plays the UNO reverse card on Ron | Parks and Recreation” (the official Parks and Recreation channel,
// Season 6): Ron asks Donna to help make costumes at his daughter's school; she agrees if he keeps her ex Joe away, but
// Ron warms to Joe, tells Donna not to confuse drama with happiness, and in the end Donna turns the praise on Ron.
// Segments from the captions, words from whisper (2026-11-16). Untested: 42–48 s ("Tammy Two"/"too" and the coroner
// story), 113–119 s (the girls' calls; who says "Ron's got sharp tools"), 147–166 s (the woodworking talk, jargon),
// 181–187 s (Donna's list with sex in it), 232–241 s ("that red thing"), 246–250 s (a child, "King Sparkle"), and
// 284–308 s (whisper's "Thank you" lines aren't in the captions).
// EAR CHECK: 28.9–31.3 s nt3 x1 — both sources have "I'll do you this solid" (not "a solid") and "keep an eye out";
//   confirm "this" and the linking of "keep an eye out"
// EAR CHECK: 273.1 s s2 — "you'd be" (both sources): confirm it's two short syllables, with no "ever" and no "could"
import type { Clip } from '../types.ts';

export const donnaJoe: Clip = {
  id: 'donnajoe', video: 'zEQaedWeLO0', title: 'Donna\'s ex plays the UNO reverse card on Ron', dur: 308, wpm: 154,
  band: 'mid', tags: ['友だち', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, the key was the only choice with "daughter"): three jobs around one kids' show
    // why: writing ← "youth revue about the history of Pawnee" heard as the task; concert ← "Unity concert" + "school"
    //   heard as setting up the event
    { id: 'd1', skill: 'detail', level: 'B1', point: 'favor', seg: [12.2, 26.7],
      stem: 'What does Ron need Donna’s help with?',
      choices: ['Making costumes for a kids’ show', 'Writing a show on Pawnee’s past',
                'Helping set up a concert at a school'], a: 0,
      cue: 'so I want you to のあと、文の最後まで。',
      line: 'I want you to come with me to my daughter’s… school *to help make costumes*.',
      said: '娘の小学校で、子ども劇の衣装作りを手伝ってほしいと頼む。',
      mean: '頼みの中身は最後の to help make costumes。コンサートや歴史は説明。',
      trap: 'concert や history が先なので、劇や催しの準備に聞こえやすい。頼みは文の最後。',
      use: 'Could you help me make dinner?（夕飯作り、手伝ってくれる？）' },

    // anchor: 28.9–30.0 s both sources have "I'll do you this solid"; the set phrase is "do (someone) a solid", and
    //   "this" points at the favor Ron has just asked for
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'solid', seg: [28.3, 32.8],
      stem: 'Type Donna’s reply: “I’ll ___, but…” (4 words)', answer: 'do you this solid',
      cue: 'elementary school のあと、but の前の4語。',
      line: 'I’ll *do you this solid*, but you’re gonna have to…',
      said: '「この頼み、聞いてあげる。でもね」と言う。do you は弱く、ひと続き。',
      mean: '決まった形は do someone a solid（ひと肌脱ぐ）。今の頼みを指して a が this に。',
      trap: '覚えた形の a を書きたくなるが、聞こえたのは this。書き取りは音どおりに。',
      use: 'Can you do me a solid?（ちょっと頼まれてくれる？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'eyeout', seg: [28.4, 32.8],
      stem: 'Type what Donna says: “You’re gonna have to ___ for my ex.” (4 words)', answer: 'keep an eye out',
      cue: 'have to のあと、4語がひと続きに。',
      line: 'you’re gonna have to *keep an eye out* for my ex-boyfriend, Joe.',
      said: '「元カレのジョーを見張っててね」と条件を付ける。',
      mean: 'keep an eye out for ＝ 〜に注意している。4語がつながり「キーパナイアウ」に近い。',
      trap: 'an は弱く、eye と out もつながるので、語の数を手がかりに区切る。',
      use: 'Keep an eye out for our bus.（バスが来ないか見ててね）' },

    // why: owe me ← "exchange of services" heard as Ron setting a price; let me think ← the formal "I understand this
    //   problem" heard as a polite stall (検討します)
    // anchor: 38.6–48.2 s "my two ex-wives are the worst people in the world" and the coroner story: he knows the
    //   problem first-hand, so "agree" is a plain yes, said at once
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'exchange', seg: [37.2, 62.2],
      stem: 'Which plain-English version keeps what Ron means by his last reply?',
      choices: ['“Deal. I know that kind of ex too well.”', '“Fine, but you’ll owe me for this one.”',
                '“I see the problem, but let me think.”'], a: 0,
      cue: '元妻の話と、最後の硬い言い方の中身。',
      line: 'my two ex-wives are the worst people in the world… I *understand this problem well* and *agree to this exchange of services*.',
      said: '元妻2人は世界最悪だと語り、「問題はよく分かる。役務の交換に同意する」と答える。',
      mean: '契約書のように硬いが、中身は「了解、任せろ」。同じ目にあったので即答。',
      trap: '「理解する」は「検討します」のような保留に聞こえやすい。硬くても agree は了解。',
      use: 'Deal. Consider it done.（了解、任せといて）' },

    // R fix: V2 (blind 55 %, the only negative choice): a second "something to hide" reading, the wrong one
    // why: did something ← "blackmail" heard as a misdeed to hide (the wrong implication); daughter ← "picture" + his
    //   daughter's school heard as a keepsake
    { id: 'i1', skill: 'infer', level: 'B2', point: 'blackmail', seg: [67.3, 74.3],
      stem: 'What does Donna’s reason for the photo suggest about Ron?',
      choices: ['He’d be embarrassed to be seen helping here', 'He did something at the school he’d want hidden',
                'He’d want a photo for his daughter'], a: 0,
      cue: 'in case のあと、写真を何に使うか。',
      line: 'a picture of you *volunteering at a public elementary school* in case I ever need to *blackmail* you.',
      said: '「公立小学校でボランティアしてる写真。いつか脅すときのため」と撮る。',
      mean: '脅しの材料になるのは、ロンが人に知られたくない姿だから。',
      trap: 'blackmail で悪事を想像しやすいが、写真に写るのはボランティア中の姿。何が弱みかを聞く。',
      use: 'Just in case I ever need it.（いつか必要になったときのためにね）' },

    // R fix: V2 + S1 (blind 75 %: "clock-time phrase" in the stem and one location choice): the stem names the moment
    //   only, and two choices are directions
    // why: off to the right ← "twelve" caught as "two" (/tw/ kept, "-elve" lost), and two o'clock is ahead-right;
    //   noon ← the literal reading of twelve o'clock
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'oclock', seg: [74.2, 77.2],
      stem: 'Right after “that’s Joe”, what does Donna tell Ron?',
      choices: ['Joe is straight ahead of them', 'Joe is ahead, off to their right', 'Joe will be there at noon'], a: 0,
      cue: 'Joe の名前のすぐあと、時刻のような言い方。',
      line: 'Uh, that’s Joe, *12 o’clock*.',
      said: '「あ、ジョーよ。12時の方向」とロンに知らせる。',
      mean: '時計の文字盤で方向を言う言い方。12時＝真正面。時刻の話ではない。',
      trap: 'o’clock で時刻と思いやすく、twelve の語尾が弱いと two に聞こえる。人を指す「〜時」は方向。',
      use: 'Waiter at three o’clock. Wave now.（3時の方向に店員。今手を振って）' },

    // R fix: V2 (blind 70 %, the usual sitcom turn): a second "wary at first" arc, where he only admires the skills
    // why: only his skills ← "well played" and the jig talk are praise of what Joe does, not of Joe; friendly then
    //   wary ← "pleasure to meet you… don't hesitate to ask" is Joe's warmth, heard as Ron's
    { id: 'g1', skill: 'gist', level: 'B2', point: 'view', reveals: ['onto'], seg: [76.5, 180.0],
      stem: 'Over his time at the school, how does Ron’s view of Joe change?',
      choices: ['He starts out wary and ends up liking him', 'He starts out wary and ends up only admiring his skills',
                'He starts out friendly and ends up wary of him'], a: 0,
      cue: '最初のあいさつと、ドナと二人になってからの言葉。',
      line: 'I’m on to you, friend. … *I like Joe*.',
      said: '最初は「お見通しだぞ」と警告するが、歌や木工の話のあと、ドナに「ジョーが好きだ」と言う。',
      mean: '頼まれて見張るはずが、ジョーの人柄を知って味方になっていく流れ。',
      trap: '親しげなあいさつはジョーの方の態度。誰の気持ちかは、声と順番で分けて聞く。',
      use: 'He grew on me.（だんだん好きになった）' },

    // R fix: V2 (blind 50 %): a near-sound distractor (associate/assistant) replaces the made-up name
    // why: assistant ← "associate" heard as "assistant", a self-lowering joke; boyfriend ← he's there to keep Joe
    //   away, so a rival act seems likely
    { id: 'h1', skill: 'humor', level: 'C1', point: 'proximity', seg: [85.0, 90.4],
      stem: 'Why is Ron’s introduction of himself to Joe funny?',
      choices: ['He describes a plain coworker in stiff, odd words', 'He presents himself as Donna’s personal assistant',
                'He acts as if he were Donna’s new boyfriend'], a: 0,
      cue: 'I am Donna’s のあと、自分をどう呼ぶか。',
      line: 'I am Donna’s *work proximity associate*.',
      said: '「ドナの職場近接同僚です」と、わざわざ硬い言葉で名乗る。',
      mean: 'ただの「同僚」を、事務的で変な肩書きにしている。友達と言わない距離感も笑いどころ。',
      trap: 'associate を assistant と聞くと謙遜の冗談に聞こえる。硬すぎる言葉が笑い。',
      use: 'This is Ken, my coworker.（同僚のケンです）' },

    // R fix: V2 (blind 55 %): three parallel "Letting Joe know…" readings; "take you up on it" is the near miss
    // why: take him up on it ← "on to you" heard as "I'll hold you to it", a reply to the offer; likes him ← "friend"
    //   taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'onto', seg: [101.4, 109.5],
      stem: 'After Joe offers to help with anything, what is Ron doing?',
      choices: ['Letting Joe know he sees through him', 'Letting Joe know he’ll take him up on it',
                'Letting Joe know he likes him'], a: 0,
      cue: 'okay のあと、ロンの短い2つの言葉。',
      line: '*I’m on to you*, friend. … *Tread lightly*.',
      said: '親切な申し出に「たくらみは分かってるぞ。気をつけろ」と返す。',
      mean: 'I’m on to you ＝ 企みを見抜いた。friend はここでは脅しの呼びかけ。',
      trap: 'on to you を申し出への返事と取りやすい。tread lightly と並べば警告。',
      use: 'I’m on to you. No more tricks.（バレてるよ。もう小細工なしね）' },

    // R fix: V2 (blind 70 %) + d2 leak: the stem no longer says "rhyme" (d2's key); a game reading replaces "watch Ron"
    // why: warm up to sing ← he teaches music and there's a concert; game ← "Ron, play with us!" just before, and the
    //   chant sounds like a clapping game
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'rhyme', seg: [119.3, 133.0],
      stem: 'When Joe starts “Ladies, eyes are watching…”, what is he doing?',
      choices: ['Getting the girls to quiet down', 'Warming the girls up to sing',
                'Starting the game the girls asked for'], a: 0,
      cue: 'lips や hands のあとの語に注目。',
      line: 'eyes are watching, ears are listening, *lips are closed, hands are still*',
      said: '「目は見て、耳は聞いて、口は閉じ、手は止めて」と唱える。',
      mean: '騒ぐ子どもを静かにさせるための決まり文句。歌の練習ではない。',
      trap: '節のある唱え方なので歌や遊びに聞こえやすい。closed や still が目的を示す。',
      use: 'Okay, everyone, eyes on me.（はい、みんなこっちを見て）' },

    // R fix: S1 (the stem said "the girls go quiet", pr1's key) and the "rhyme" choice (d2's key)
    // why: mocks ← a sing-song chant sounds childish, so "well played" is heard as sarcasm; sulks ← the girls were
    //   calling Ron, and Joe stepped in
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'wellplayed', seg: [133.8, 136.85],
      stem: 'Right after Joe’s chant, how does Ron react?',
      choices: ['He gives Joe credit for it', 'He mocks Joe’s sing-song chant', 'He’s sore Joe took over'], a: 0,
      cue: '短いひと言。played の前の語。',
      line: 'That was *well played*.',
      said: '子どもたちが静かになり、ロンが「見事だった」と言う。',
      mean: 'well played ＝ うまくやったな。ゲームの「ナイスプレー」と同じで、本気で認めている。',
      trap: '子ども向けの歌なので皮肉に聞こえやすい。皮肉なら茶化す言葉が続く。',
      use: 'Well played. You got me.（うまいね、一本取られた）' },

    // R fix: V2 (blind 65 %, helped by "rhyme" in pr1's stem and a2's choice): near-sound and half-right distractors
    // why: music and movement ← "melody" ≈ music, half heard; rhythm and rules ← "rhyme" heard as "rhythm", and
    //   "lips are closed, hands are still" sounds like class rules
    { id: 'd2', skill: 'detail', level: 'B1', point: 'melody', seg: [136.4, 141.2],
      stem: 'According to Joe, what do girls that age respond well to?',
      choices: ['Melody and rhyme', 'Music and movement', 'Rhythm and rules'], a: 0,
      cue: 'respond positively to のあと。',
      line: 'Children their age *respond positively to melody and rhyme*.',
      said: '「あの年の子は、メロディーと韻によく反応する」と説明する。',
      mean: 'さっきの言葉遊びの種明かし。音楽の先生らしい理由。',
      trap: 'rhyme は rhythm と、melody は music と取り違えやすい。理由は to のあとの2語を拾う。',
      use: 'Kids respond well to music.（子どもは音楽によく反応する）' },

    // why: bad news ← "I'm just gonna say it" usually comes before something harsh; rather not talk ← "don't care"
    //   taken literally
    // R fix: B1 (said says he praises Joe, g1's key): reveals view
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'honestly', reveals: ['view'], seg: [168.6, 173.4],
      stem: 'When Ron starts his opinion of Joe, what does his opening do?',
      choices: ['It plays down how much his opinion matters', 'It warns Donna that bad news about Joe is coming',
                'It shows he’d rather not talk about Joe at all'], a: 0,
      cue: 'I like Joe の前の、前置き部分。',
      line: 'I *honestly don’t care*, but *I’m just gonna say it*.',
      said: '「正直どうでもいいが、言わせてもらう」と前置きして、ジョーを褒める。',
      mean: '興味がないふりで、意見を押しつけない形にする前置き。',
      trap: 'just gonna say it は悪口の前にも使うので身構えやすい。前置きのあとに来る中身で決める。',
      use: 'Not my business, but I’ll say it.（余計なお世話だけど、言わせて）' },

    // R fix: V2 (blind 50 %, the only warm, full list): two more lists of the same shape and length
    // why: tools ← the jig and "hackberry" talk just before; too eager ← "don't hesitate to ask" and the muffins
    { id: 'd3', skill: 'detail', level: 'B1', point: 'qualities', reveals: ['view'], seg: [171.9, 177.6],
      stem: 'How does Ron describe Joe to Donna?',
      choices: ['Nice, smart, patient, and good with kids', 'Handy and clever, and good with his tools',
                'Nice enough, but much too eager to please'], a: 0,
      cue: 'I like Joe のあと、並べる言葉。',
      line: 'He’s a *nice man who’s good with kids*, and he seems to be *smart and patient*.',
      said: '「いい人で子どもの扱いがうまい。頭が良くて辛抱強そうだ」と言う。',
      mean: '直前の木工の話ではなく、人柄をほめている。見張るはずだった相手への評価。',
      trap: '道具の話を聞いたばかりなので、器用さと思いやすい。並べた形容詞を一つずつ拾う。',
      use: 'She’s patient and great with kids.（彼女は辛抱強くて子どもの扱いが上手）' },

    // R fix: K6 (the key was the only two-part "Not that…, but…" choice): parallel "That…" choices
    // why: secretly bad ← "Tammy" is the worst ex in Ron's story (42 s): the right mechanism, the wrong target; too
    //   good ← "I know" agrees he's nice, so it sounds like she feels unworthy (the 謙遜 frame)
    // anchor: 49.0–53.7 s "he turns me into a person I don't like or recognize"; 177.8 s "I know, that's why he's my
    //   Tammy", right after Ron's praise; 194.5 s "I've become boring"
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'tammy', reveals: ['nightmare'], seg: [177.4, 195.7],
      stem: 'When Donna says “that’s why he’s my Tammy”, what makes Joe her Tammy?',
      choices: ['That his goodness turns her into someone else', 'That he’s secretly as bad as Ron’s ex-wife',
                'That he’s too good for her to ever keep'], a: 0,
      cue: 'I know のあとと、最後の boring まで。',
      line: 'I know, *that’s why* he’s my Tammy. … *I’ve become boring*.',
      said: 'ジョーを褒められ「分かってる、だから私のタミーなの」と返し、退屈になったと言う。',
      mean: 'タミーは悪人の代名詞だが、ドナは逆。いい人すぎて自分が別人になるから。',
      trap: 'タミー＝最悪の元妻と聞いたので、裏があると思いやすい。I know で評価を認めている。',
      use: 'That’s exactly the problem.（まさにそこが問題なの）' },

    // R fix: V2 (blind 60 %: "faults" in the stem set up the virtue twist) + S4 (the start cut Ron's "Enough"): the
    //   stem says "life with Joe", and the choices are three ways the speech could be funny
    // why: hard to live with ← "turns me into a person I don't like" from the opening, aimed at herself; bitter ←
    //   he's her ex, so a complaint sounds like leftover anger from the breakup
    { id: 'h2', skill: 'humor', level: 'C1', point: 'nightmare', seg: [187.7, 195.7],
      stem: 'Why does Donna’s description of life with Joe get a laugh?',
      choices: ['She treats a caring partner as a burden', 'She admits she’s the hard one to live with',
                'She’s still bitter about how they broke up'], a: 0,
      cue: 'It’s a nightmare の前に並ぶ3つ。',
      line: 'He’s constantly being *respectful*, wanting to *spend time with me*… It’s a *nightmare*.',
      said: '「いつも敬意を払って、一緒にいたがって、心を通わせようとする。悪夢よ」と言う。',
      mean: '欠点として並べた事が全部ほめ言葉。悪夢の中身が普通なら理想、というずれが笑い。',
      trap: '自分の話や昔の恨みと取りやすいが、主語はずっと he。文句の形で長所を並べたら笑い。',
      use: 'The worst part? He’s too nice.（最悪なのは？優しすぎること）' },

    // R fix: V2 + K6 (blind 60 %, the key was the only hedged choice): all three hedged with "may"
    // why: more spark ← "drama" heard as something she should get back; on her own ← "Live your life how you want"
    //   heard as "you don't need him"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'drama', seg: [196.1, 201.8],
      stem: 'What is Ron hinting about Donna’s life with Joe?',
      choices: ['The calm she calls boring may be happiness', 'She may need someone who brings more spark',
                'She may be happier with nobody for now'], a: 0,
      cue: 'but のあと、何と何を取り違えるなと言うか。',
      line: 'Live your life how you want. But *don’t confuse drama with happiness*.',
      said: '「好きに生きればいい。だが騒ぎと幸せを取り違えるな」と言う。',
      mean: '刺激がない＝退屈、と思っているドナに、穏やかな今こそ幸せかもしれないと伝えている。',
      trap: '前半だけだと「一人で好きに」と聞こえる。but のあとに本音が来る。',
      use: 'Do what you want, but think it over.（好きにすればいい。でもよく考えて）' },

    // why: taken to a garage ← "garage" is the last word; called a garage ← "go to a garage" heard as already arranged
    { id: 'd4', skill: 'detail', level: 'B1', point: 'tire', seg: [202.5, 211.2],
      stem: 'What has Joe done for Donna without asking?',
      choices: ['Fixed and pumped up her tire', 'Taken her car to a garage', 'Called a garage about her tire'], a: 0,
      cue: 'So I のあとの動詞2つと、最後の but。',
      line: 'So I *patched it and I inflated it* for you. But you’re still gonna want to go to a garage.',
      said: '「タイヤの穴をふさいで空気を入れた。でも修理工場には行ってね」と言う。',
      mean: '頼まれる前に直しておく、気の利きすぎる親切。garage はこれから行く所。',
      trap: '最後の garage で、もう持っていったと思いやすい。gonna want to は助言。',
      use: 'You’re still gonna want a doctor.（それでも医者には行った方がいい）' },

    // R fix: V2 + K6 (blind 55 %, the key was the only two-part choice) + S4 (the start cut "garage"): three two-part
    //   outcomes
    // why: friends ← "I promise not to cheat… not pin me down" heard as holding him off; car ← "I patched it… still
    //   gonna want to go to a garage" just before, heard as a condition
    { id: 'g2', skill: 'gist', level: 'B2', point: 'date', reveals: ['pindown'], seg: [211.2, 256.0],
      stem: 'By the end, where do things stand between Donna and Joe?',
      choices: ['She’ll date him again, on her own terms', 'She’ll stay friends with him, but no more',
                'She’ll date him again, once he fixes her car'], a: 0,
      cue: 'Friday と next week が出てくる所。',
      line: 'You can *take me to dinner*, Friday.',
      said: '好きな事や条件を話したあと「金曜に夕食に連れてって」と言い、ロンにも報告する。',
      mean: '避けていた元カレと、自分のペースを守る約束つきで、また会う事にした。',
      trap: '条件の話が長いので断っているように聞こえる。最後に誘いを受けたかどうかで決める。',
      use: 'You can take me to lunch Sunday.（日曜にランチおごってね）' },

    // why: hour ← short outings like museums, said just before; week ← "fly fishing" sounds like a long trip
    { id: 'n1', skill: 'number', level: 'B1', point: 'days', seg: [215.4, 221.0],
      stem: 'How long does Donna say she sometimes disappears for?',
      choices: ['An hour or two', 'A day or two', 'A week or two'], a: 1, keep: true,
      cue: 'disappear for のあと、短い時間の単位。',
      line: 'Sometimes I *disappear for a day or two*',
      said: '「ときどき1、2日いなくなる。フライフィッシングかサッカー観戦」と言う。',
      mean: '自由に動き回る自分を見せ、縛られたくないと伝える前置き。',
      trap: 'for a の a は弱く、day と or もつながる。単位の語は強く読まれるので、そこを拾う。',
      use: 'I’ll be gone for a day or two.（1、2日留守にするね）' },

    // why: say where she goes ← "I disappear for a day or two" just before; give up hobbies ← the list of museums,
    //   opera, fishing
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'pindown', seg: [221.5, 228.3],
      stem: 'What does Donna ask Joe not to do in return?',
      choices: ['Rush her into something serious', 'Make her say where she goes', 'Ask her to give up her hobbies'],
      a: 0,
      cue: 'if you promise のあと、too fast の前。',
      line: 'if you promise *not to try to pin me down too fast*.',
      said: '「浮気はしない。そのかわり急いで私を縛らないで」と条件を出す。',
      mean: 'pin down ＝ 押さえつける、決めさせる。早々に本気の関係を求めないで、の意味。',
      trap: '直前の「1、2日いなくなる」から、行き先の報告と思いやすい。too fast は時期の話。',
      use: 'Don’t pin me down to a date yet.（まだ日にちは決めさせないで）' },

    // why: Joe ← the line right before is about dinner with Joe, and Ron hears it that way; herself ← she said she'd
    //   become boring, so "change" sounds like her own
    // R fix: V2 (blind 60 %: the quoted "someone" flagged a twist): the stem names the moment without the quote
    { id: 'i3', skill: 'infer', level: 'B2', point: 'someone', seg: [252.6, 265.6],
      stem: 'When Donna talks about people changing for the better, who does she mean?',
      choices: ['Ron', 'Joe', 'Herself'], a: 0,
      cue: 'ロンの返事と、そのあとドナが言い直す所。',
      line: 'It’s always nice to see *someone* actually change for the better. … *I was talking about you*.',
      said: '「人が良い方に変わるのはいい」と言い、ジョーの話と取ったロンに「あなたの事」と返す。',
      mean: '変わったのはロン自身。ロンは褒め言葉の向きを取り違えた。',
      trap: '直前がジョーとの食事の話なので、ジョーの事だと思いやすい。言い直しの you を聞く。',
      use: 'I wasn’t talking about her. I meant you.（彼女じゃなくて、君の事だよ）' },

    // R fix: K1 + V2 (blind 55 %; "thinks she's sarcastic" was close to the key): a modesty reading (謙遜) replaces it
    // why: modest ← "You take that back" heard as いえいえ, a polite refusal of praise; family ← "your family" opens
    //   the line
    { id: 'h3', skill: 'humor', level: 'C1', point: 'takeback', reveals: ['someone'], seg: [265.4, 270.6],
      stem: 'When Donna tells Ron how his family changed him, why is his reply funny?',
      choices: ['He treats kind words like an insult', 'He’s too modest to accept the praise',
                'He’s upset she named his family'], a: 0,
      cue: 'ほめ言葉のすぐあと、ロンの短い返し。',
      line: 'Your family has made you *a more patient and empathetic person*. — *You take that back*.',
      said: '「家族のおかげで辛抱強く優しくなった」と言われ「取り消せ」と返す。',
      mean: 'take that back は悪口への返し。ほめ言葉に使うのが硬派なロンらしい笑い。',
      trap: '「いえいえ」の謙遜に取りやすい。take that back は悪口を取り消させる型。',
      use: 'Take that back! I am not cute.（取り消して！かわいくなんかない）' },

    // R fix: V2 + §9.5 (blind 70 %: only "you'd be" fit the grammar): three grammatical fills that differ in sound
    // why: you'd ever be ← "think even" just before primes "ever", and the short "you'd" sounds stretched; you could
    //   be ← the swallowed d heard as the end of "could"
    { id: 's2', skill: 'sound', level: 'B2', point: 'youdbe', seg: [270.6, 276.4],
      stem: 'Fill the gap: “Did you think even two years ago ___ playing matchmaker?”',
      choices: ['you’d be', 'you’d ever be', 'you could be'], a: 0,
      cue: 'two years ago のあと、短く弱い2語。',
      line: 'Did you think even two years ago *you’d be* playing matchmaker for me',
      said: '「2年前、私の縁結びをするなんて思った？」とからかう。',
      mean: 'you’d be は you would be。d は b の前で消え「ユビー」に近い。',
      trap: 'even につられて ever を、消えた d から could を補いやすい。音の数を数える。',
      use: 'I never thought I’d be living here.（ここに住むなんて思わなかった）' },
  ]
};
