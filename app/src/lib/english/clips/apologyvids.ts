// “Leslie invents apology videos | Parks and Recreation” (the official Parks and Recreation channel, Season 1): Leslie
// locks up a company gift basket, joins the men's after-work drinks, opens the basket to keep them from leaving, then
// confesses on video, to her coworkers and to Ron, who thinks it's no big deal, and finally "whistle-blows" herself.
// Segments from the captions, words from whisper (2026-11-16). Untested: 35.6 s (whisper's "red tape and uphill
// battles" isn't in the captions), 50–57 s (introductions), 60–63 s ("is yours…", unclear), 75–81 s (Ann's line with
// an insult, missing from the captions), 102.6–117.5 s (no speech), 175.5 s (whisper "prudish", captions "pretty"),
// 179–180 s (whisper's "darling" isn't in the captions), 196–203 s (the potpourri talk; who says "not the one on
// trial"), 221–226 s (who says "Why can't I look away?"), 258.8–268 s (captions "worth the crime" vs whisper "worse
// than the crime", and most of the "double dirty" line is missing from the captions), 298.4–318.8 s (music; whisper's
// repeated "see you next time" is a hallucination).
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 3 (on 2 lines, unchanged)
//   Open: h1 (21.5 s), nt1 (23.9 s) and i1 (17.3 s) run past 15 s, because each needs both ends: the party names for
//   h1, the bar and the video for nt1, the question and the reply for i1.
//   Open: draw sim, play 4, seeds 6 and 16 (1, 6 and 14 with "harder" on): no unseen C2 can be drawn (nt1 shares
//   `basket` with g2; nt3 reveals `bigdeal`). This was there before the review.
// EAR CHECK: 236.7–240.0 s nt2 s1 — both sources have "It's not that big a deal" and "it isn't a big deal": confirm
//   no "of" before "a", and that the t of "isn't" drops before "a"
// EAR CHECK: 40.3–41.7 s x1 — both sources have "I'll tell you what's up": confirm the linking ("tell you" → "telyu",
//   "what's up" run together)
import type { Clip } from '../types.ts';

export const apologyVideos: Clip = {
  id: 'apologyvids', video: 'FLfZaYRHKGc', title: 'Leslie invents apology videos', dur: 319, wpm: 174,
  band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: $20 ← the weak "five" of "twenty-five" lost before "for"; $250 ← "twenty-five" heard as "two-fifty"
    { id: 'n1', skill: 'number', level: 'B1', point: 'limit', seg: [14.0, 20.2],
      stem: 'What is the most a gift can be worth, by the rule Leslie cites?',
      choices: ['$20', '$25', '$250'], a: 1, keep: true,
      cue: 'gifts over のあと、金額の数字。',
      line: 'we are not allowed to accept *gifts over $25* for corruption reasons.',
      said: '「汚職防止のため、25ドルを超える贈り物は受け取れない」と言う。',
      mean: '会社から届いたかごは高そうなので、受け取れば規則違反になる。',
      trap: 'twenty-five の five は for の前で弱く、twenty だけ拾いやすい。数字は最後まで聞く。',
      use: 'Is there a limit on gifts?（贈り物に上限はありますか）' },

    // R fix: V2 (blind 70 %): "small fish in a big town" was a filler. The new trap keeps "watching" but flips who
    //   watches.
    // why: no room ← the literal bowl (金魚鉢) read as being boxed in, and she has just cited a rule; each other ←
    //   "always watching" heard, but not who is watching
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'fishbowl', seg: [19.4, 29.5],
      stem: 'What does Leslie’s fish-tank image say about their jobs?',
      choices: ['The public sees everything they do', 'They must keep an eye on each other',
                'The rules leave them no room to move'], a: 0,
      cue: 'fishbowl のあと、and で続く言い換え。',
      line: 'We *live in a fishbowl* and *the public is always watching*.',
      said: '「私たちは金魚鉢の中にいて、市民はいつも見ている」と言う。',
      mean: 'live in a fishbowl ＝ 何をしても周りから丸見え。公務員は人目にさらされている。',
      trap: '金魚鉢を「狭い・窮屈」と取りやすい。比喩のすぐあとの文が、意味の説明になる事が多い。',
      use: 'It’s like living in a fishbowl here.（ここは何でも丸見えだね）' },

    // R fix: V2 (blind 50 %): the key carried its own reason ("so nobody can enjoy it"); the others didn't. Now
    //   three bare actions.
    // why: send back ← "not allowed to accept" makes returning it the usual script; Tom keeps the cheese ← Tom's
    //   "I want to take that cheese…" from the opening
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lock', seg: [29.6, 35.1],
      stem: 'What does Leslie decide to do with the basket?',
      choices: ['Lock it away out of reach', 'Send it back to the company', 'Let Tom keep just the cheese'], a: 0,
      cue: 'temptation のあとの動詞。',
      line: 'to avoid temptation, I’m going to *lock it up*.',
      said: '「誘惑に負けないよう、鍵をかけてしまっておく」と言う。',
      mean: '返すのでも分けるのでもなく、誰も手を出せないように保管する。あとの展開の前ふり。',
      trap: '受け取れない物は返すのが普通なので、返送と思いやすい。言ったのは lock の動作。',
      use: 'I’ll lock it up for now.（とりあえず、しまっておくね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'whatsup', seg: [39.3, 44.9],
      stem: 'Type Leslie’s answer: “I’ll ___.” (4 words)', answer: "tell you what's up",
      cue: 'What is up? と聞かれた直後。',
      line: 'I’ll *tell you what’s up*. A couple of ladies are coming to…',
      said: '「何かって？教えてあげる」と返す。',
      mean: 'tell you は「テリュー」、what’s up は「ワッツァップ」とつながる。相手の質問を使った返し。',
      trap: 'you と what’s が弱く、2語に聞こえやすい。相手の質問の語は、返事に戻ってきやすい。',
      use: 'I’ll tell you what happened.（何があったか話すよ）' },

    // why: gossip ← "socializing" heard as chatting about people; club rules ← "The boys club is more about…" heard
    //   as an explanation of how the club works
    { id: 'i1', skill: 'infer', level: 'B2', point: 'topic', seg: [58.0, 75.3],
      stem: 'What does the reply to Leslie’s “What’s the topic?” suggest she expected?',
      choices: ['A serious talk about work', 'Some gossip about the office', 'An explanation of the club’s rules'],
      a: 0,
      cue: '返事の more about … than … の比べ方。',
      line: 'So what are you guys talking about? … The boys club is *more about socializing than work*, you know?',
      said: '「議題は？」と聞くと、「この集まりは仕事より付き合いの場。肩の力を抜いて」と返される。',
      mean: '議題を聞くのは会議の発想。返事は、仕事の話をしに来たと思われた事を示す。',
      trap: 'socializing を「うわさ話」と取りやすい。何を打ち消す返事かを聞く。',
      use: 'It’s more social than business.（仕事というより、交流の場だよ）' },

    // R fix: V2 (blind 55 %): "laugh at her joke" was a filler. The new trap is the idiom's usual sense, promotion.
    // why: beer ← "Let me get you a beer" just before; promoted ← "glass ceiling" learned as a block on women's
    //   promotion (昇進の壁), but nothing about a promotion is said
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'ceiling', seg: [64.0, 70.15],
      stem: 'What is Leslie celebrating with her line about a sound?',
      choices: ['Getting into a group that was all men', 'Being the first woman to be promoted',
                'Being offered a beer by the men'], a: 0,
      cue: 'glass のあとの語と、何が割れたか。',
      line: 'That was the sound of *a glass ceiling being shattered*.',
      said: '「今の聞こえた？ガラスの天井が割れた音よ」と言う。',
      mean: 'glass ceiling ＝ 女性の参加や昇進を阻む見えない壁。男だけの集まりに入れた事を大げさに祝う。',
      trap: '直前にビールを勧められたので、その話と思いやすい。比喩は「何が割れたか」で決まる。',
      use: 'She broke the glass ceiling.（彼女はガラスの天井を破った）' },

    // R fix: V2 (blind 60 %): two thin distractors. Both now carry the scene's own words (breaking in, welcoming).
    // why: celebrate ← the glass-ceiling line earlier; thank ← "Glad to have you. Let me get you a beer"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'basket', reveals: ['lock', 'ceiling'], seg: [82.4, 122.0],
      stem: 'Why does Leslie end up bringing out wine and cheese?',
      choices: ['To keep the men from going home', 'To celebrate breaking into the club',
                'To thank the men for welcoming her'], a: 0,
      cue: 'out of beer のあと、男たちが何をし始めるか。',
      line: 'We’re out of beer. … I think I’m gonna *take off*, too. … I got wine.',
      said: 'ビールが切れて男たちが帰り始めると、レスリーは引き止め、ワインとチーズを持って戻る。',
      mean: '会を続けるため、しまったはずの贈り物を開けた。これが後の謝罪の原因。',
      trap: '「ガラスの天井」の流れで、お祝いと思いやすい。きっかけは帰りかけた男たち。',
      use: 'Wait, don’t go yet! I have snacks.（待って、まだ帰らないで！おやつあるよ）' },

    // R fix: V2 (blind 50 %): the apology choice had no basis in the line. Now a warm-joke reading of the same
    //   "Uh, yeah".
    // why: agrees ← "Uh, yeah, because parties usually get started…" opens like agreement; stays on ← a joke read as
    //   friendly teasing that ends in a yes (Japanese ノリツッコミ)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'booze', seg: [93.35, 99.55],
      stem: 'When Leslie says the night is just getting started, how does a man answer?',
      choices: ['He teases her for trying to keep it going', 'He agrees, since the fun starts later on',
                'He jokes, but warmly offers to stay on'], a: 0,
      cue: 'yeah, because のあと、文の最後の語。',
      line: 'Uh, yeah, because *parties usually get started when you run out of booze*.',
      said: '「ああ、そうだね。パーティーって酒が切れたら始まるもんね」と返す。',
      mean: '酒が切れたら終わるのが普通。わざと逆を言って、レスリーの引き止めをからかっている。',
      trap: 'yeah, because で始まるので同意に聞こえやすい。常識と逆の理由が続いたら皮肉。',
      use: 'Oh yeah, because that always works.（ああ、それでいつもうまくいくもんね）' },

    // R fix: V2 (blind 55 %): the distractors were padded ("for the night", "herself"). Trimmed, so the three read
    //   alike.
    // why: bought it ← the cheerful "Hey!" makes it sound like her own treat for the party; Ann's ← Ann came along
    //   with her, so the bottle seems to be hers
    // anchor: 6.1–10.3 s the basket holds "Great Lakes wine… that cheese"; 117.5–121 s "I got wine… and cheese";
    //   129.3–136.3 s to camera "in a foolish attempt to infiltrate a boys club, I violated the… ethics code"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'basket', reveals: ['ethics', 'lock'], seg: [117.2, 141.1], retired: true,
      stem: 'After her video statement, how should we hear “I got wine. And cheese.”?',
      choices: ['As the gift basket she had locked away', 'As a treat she ran out and bought',
                'As a bottle Ann had brought along'], a: 0,
      cue: 'カメラへの一言で、何の規則を破ったと言うか。',
      line: '*I got wine.* … And cheese. … in a foolish attempt to *infiltrate a boys club*, I *violated* the… *ethics code*',
      said: 'ワインとチーズを出した翌朝、カメラに「男の集まりに入りこもうとして、倫理規定を破った」と話す。',
      mean: 'かごの中身もワインとチーズ。カメラへの一言で、場面の差し入れが贈り物を開けた違反だと分かる。',
      trap: '明るい「Hey!」だけだと、ただの差し入れに聞こえる。場面とカメラへの一言は、つなげて聞く。',
      use: 'Wait, is this from the gift basket?（待って、これって贈答品のかごの？）' },

    // R fix: V2 (blind 60 %): "coworkers want to see her punished" was an outside reason, easy to rule out under
    //   "by her own account". Now a fear she could voice herself.
    // why: city manager ← "an official reprimand from the city manager" heard as already ordered; Ron will report ←
    //   "I asked Ron to blow the whistle on me", but he refused
    { id: 'g1', skill: 'gist', level: 'B2', point: 'standard', seg: [127.5, 298.3],
      stem: 'By her own account, why must Leslie go so far in making amends?',
      choices: ['She must meet a higher bar as a woman', 'The city manager has ordered her to',
                'She expects Ron to report her otherwise'], a: 0,
      cue: '「あなたの世界では」のあと、but で始まる文。',
      line: 'But I am a woman and I need to *hold myself up to a higher standard*.',
      said: '「私は女性だから、自分をより高い基準で律する」とロンに言う。',
      mean: '女性の公務員は男性より厳しく見られるという考えが、謝罪をどこまでも大きくしている。',
      trap: '処分やロンへの頼み事も出るが、命令も告発もない。理由は I need to の部分。',
      use: 'I hold myself to a higher standard.（自分には厳しくしている）' },

    // R fix: V2 (blind 50 %): only the key named the state. Now a distractor uses "Indiana" too.
    // why: men's rule ← "infiltrate a boys club" just before "violated"; drinking law ← "the state of Indiana" + the
    //   beer and wine at the bar
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ethics', reveals: ['basket'], seg: [128.9, 137.0],
      stem: 'In her first video, what does Leslie say she broke?',
      choices: ['The state’s ethics code for officials', 'The men’s rule against women in the club',
                'An Indiana law on drinking in public'], a: 0,
      cue: 'violated のあと、the から Indiana まで。',
      line: 'I *violated the government employee ethics code* of the state of Indiana.',
      said: '「男の集まりに入りこもうとして、州の公務員倫理規定を破った」と言う。',
      mean: '破ったのは州の公務員の規則。上限を超える贈り物を開けた事を指す。',
      trap: '直前の boys club から、その集まりの決まりと思いやすい。violated の目的語を最後まで聞く。',
      use: 'Sorry, that’s against the rules here.（すみません、ここではそれは規則違反です）' },

    // R fix: S3: the cue held "apologize", which only the key had in that form. The cue now points at "right now".
    // why: own party ← "Republican" comes first, so it sounds like a partisan list (but "Democrat" follows); Indiana ←
    //   "the state of Indiana" a moment before, heard as the scope (but "in America", Minnesota, Wisconsin)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'list', reveals: ['basket'], seg: [145.3, 166.8],
      stem: 'Why does Leslie’s list of names get a laugh?',
      choices: ['She means to apologize to each one in turn', 'She apologizes only to women in her party',
                'She apologizes to Indiana’s women officials'], a: 0,
      cue: 'right now のあと、謝り方を言う2つの語句。',
      line: 'I would like to apologize to them… *individually and in alphabetical order*.',
      said: '全米の女性公務員に一人ずつ、アルファベット順に謝ると言う。',
      mean: 'かごを開けただけで、全米の政治家に一人ずつ謝る。規模のずれが笑い。',
      trap: 'Republican と Democrat が両方出るので党の話ではない。範囲は in America。',
      use: 'Let’s go one by one, in alphabetical order.（一人ずつ、名前順でいこう）' },

    // R fix: V2 (blind 70 %): "let in some fresh air" was too literal to tempt anyone. Now the trap is the Japanese
    //   「空気」 frame: settling the room.
    // why: calm down ← "air" heard as 場の空気, so clearing it sounds like settling everyone; lighter ← "clear" heard
    //   as clearing away a heavy topic
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'air', reveals: ['basket'], seg: [167.5, 174.2],
      stem: 'When Leslie faces the office, what does her first set phrase do?',
      choices: ['It warns that a confession is coming', 'It asks everyone to calm down first',
                'It moves the talk somewhere lighter'], a: 0,
      cue: 'Last night の直前、短い決まり文句。',
      line: '*Let’s clear the air*. Last night, I opened up this gift basket…',
      said: '「すっきりさせましょう。昨夜、このかごを開けました」と切り出す。',
      mean: 'clear the air ＝ 隠し事やわだかまりを話して、場の空気を晴らす。告白の前置き。',
      trap: 'air を「場の空気」と取ると、落ち着かせる話に聞こえる。直後の告白が意味を決める。',
      use: 'Can we talk? I want to clear the air.（話せる？わだかまりをなくしたいんだ）' },

    // R fix: V2 (blind 60 %): the key was the only careful choice ("every rule closely"). Now each choice is a
    //   habit with a slant.
    // why: bends the rules ← "Really?" heard as "typical of you"; private ← "I don't even know you anymore" read
    //   literally
    { id: 'i2', skill: 'infer', level: 'B2', point: 'stickler', seg: [174.1, 182.1],
      stem: 'What does the coworker’s reaction tell us about Leslie’s usual ways?',
      choices: ['She usually sticks closely to the rules', 'She often bends the rules for herself',
                'She usually keeps her private life private'], a: 0,
      cue: 'usually のあとと、anymore で終わる文。',
      line: 'You’re *usually* such a… *stickler for the rules*. … It’s like *I don’t even know you anymore*.',
      said: '「いつもは規則にうるさいのに。知らない人みたい」と驚く。',
      mean: 'stickler ＝ 決まりにうるさい人。今回は、いつもの彼女と正反対という反応。',
      trap: 'I don’t even know you は「よく知らない」ではなく、普段との差に驚く決まり文句。',
      use: 'She’s a stickler for deadlines.（彼女は締め切りにうるさい）' },

    // R fix: V2 (blind 50 %): "forgotten it" was a filler. Now "Two wrongs…" is heard as shifting the blame.
    // why: sorry ← she is apologizing to everyone today, so an apology seems due here too; blames the rules ← "Two
    //   wrongs do not make a right" heard as an excuse
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'writeup', seg: [181.7, 188.55],
      stem: 'Reminded of how she treated a coworker last year, what is Leslie’s stance?',
      choices: ['She stands by it and would do it again', 'She’s sorry and adds it to her apology',
                'She admits it, but blames the rules'], a: 0,
      cue: 'Yes, I did のあと、and で続く部分。',
      line: 'Yes, I did, and *I would do it again*. Two wrongs do not make a right.',
      said: '私用電話を注意した件を「ええ、した。またやる」と認める。',
      mean: '今日は謝ってばかりだが、過去の厳しさは引かない。自分にも他人にも厳しい人。',
      trap: '謝罪の場面なので、昔の事も謝ると思いやすい。and のあとに今の立場が出る。',
      use: 'I stand by what I said.（言った事は撤回しない）' },

    // R fix: V2 (blind 55 %): the distractors weren't "really saying" readings. Now each is an intent Ron could
    //   have.
    // why: make it official ← "very important" + an ethics matter make email sound like the formal route; short
    //   version ← "very long" heard as the problem
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'email', seg: [212.3, 220.9],
      stem: 'When Leslie warns her story is very long, what is Ron really saying?',
      choices: ['Spare me from having to hear it', 'Make it official, since it’s important',
                'Give me the short version, quickly'], a: 0,
      cue: 'very long の直後、ロンの短い返事。',
      line: 'I have a very important and *very long story* to tell you. — *Put it in an email?*',
      said: '「大事で、とても長い話がある」と言われ、ロンは「メールにしてくれる？」と返す。',
      mean: '長話を聞きたくない本音を、メールという形で言っている。',
      trap: '倫理の話なので、記録を残す正式な手順と思いやすい。very long への返事として聞く。',
      use: 'Can you just send me an email?（メールで送ってくれる？）' },

    // R fix: V2 (blind 50 %): "agrees to keep the matter small" went against "I will blow". Now a mocking reading.
    // why: garbles ← "in proportion" isn't the set phrase, so it sounds like a slip; mocks him ← the echo of his
    //   words heard as a jab at him
    { id: 'h3', skill: 'humor', level: 'C1', point: 'proportion', seg: [226.9, 232.2],
      stem: 'When told not to blow this out of proportion, why is Leslie’s reply funny?',
      choices: ['She flips his phrase to defend her fuss', 'She garbles the idiom without noticing',
                'She mocks him for overreacting himself'], a: 0,
      cue: 'out of と、レスリーの返しの違い。',
      line: 'Let’s not blow this out of proportion. — I will *blow this in proportion*.',
      said: '「大げさにするな」と言われ、「適切な大きさで騒ぎます」と同じ形で返す。',
      mean: 'out of を in に変え、自分の騒ぎ方は妥当だと言い張る言葉遊び。',
      trap: 'わざと崩した言い方で、うっかりではない。相手の言葉を一語だけ変えて返すのは反論の型。',
      use: 'Let’s not blow this out of proportion.（大げさにしないでおこう）' },

    // R fix: S3: the cue held "from", a word only the key had. The cue now says "before city manager".
    // why: apology ← she has been apologizing all along, and "official… city manager" fits a formal letter; fine ←
    //   the $25 limit from the opening
    { id: 'd5', skill: 'detail', level: 'B1', point: 'reprimand', reveals: ['limit'], seg: [232.3, 236.65],
      stem: 'What is the minimum punishment for this, according to Leslie?',
      choices: ['A formal warning from the city manager', 'A formal apology to the city manager',
                'A $25 fine paid to the city'], a: 0,
      cue: 'minimum punishment のあと、city manager の前。',
      line: 'The *minimum punishment* for this is *an official reprimand* from the city manager.',
      said: '「最低でも、市の管理官から正式な戒告」と言う。',
      mean: 'reprimand ＝ 戒告、正式な叱責。クビや罰金ではなく、記録に残る注意。',
      trap: '謝ってばかりの流れで、謝罪文と思いやすい。reprimand は受ける側の処分で、自分が出すものではない。',
      use: 'He got a warning, nothing more.（彼は注意を受けただけ）' },

    // anchor: 236.7–238.0 s both sources have "it's not that big a deal": six words in about 1.3 s, with "a" a weak
    //   schwa between "big" and "deal" and no "of"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'bigdeal', seg: [236.65, 240.0],
      stem: 'Type the reply: “It’s ___.” (5 words)', answer: 'not that big a deal',
      cue: 'city manager のすぐあと。文法より、聞こえた音を。',
      line: 'It’s *not that big a deal*.',
      said: '「そこまで大した事じゃない」と速く返す。a は弱く小さい。',
      mean: 'that big a deal は形容詞が a の前に出る形。of が入る言い方もあるが、ここは入っていない。',
      trap: 'that を落としたり of を足したりしやすい。文法でなく、聞こえた音を書く。',
      use: 'It’s not that big a deal, honestly.（正直、そこまでの事じゃないよ）' },

    // why: is ← the t of "isn't" drops before "a", leaving "izn"; wasn't ← the "last night" past frame of the story
    // R fix: V2 (blind 60 %): "Maybe" in the stem settled it by logic. The stem now starts "…in your world", so the
    //   sound decides.
    { id: 's1', skill: 'sound', level: 'B2', point: 'isnt', reveals: ['bigdeal'], seg: [236.65, 243.6],
      stem: 'Fill the gap: “…in your world it ___ a big deal.”',
      choices: ['isn’t', 'is', 'wasn’t'], a: 0,
      cue: 'world it のあと、big deal の前の短い語。',
      line: 'Maybe in your world it *isn’t* a big deal.',
      said: '「あなたの世界では大した事じゃないかもね」とロンに返す。',
      mean: 'isn’t の t はほぼ消え「イズンア」とつながる。相手の見方をいったん認める言い方。',
      trap: 't が消えても n の鼻音は残る。「ン」が聞こえたら否定。is だと逆の意味になる。',
      use: 'Maybe for you it isn’t a problem.（あなたには問題じゃないかもね）' },

    // R fix: V2 (blind 60 %): "thanks him and lets it drop" was a filler. Now "What do you suggest" heard as a real
    //   question.
    // why: agrees ← the short "No." gets lost; asks in earnest ← "What do you suggest we do?" heard as a real request
    //   for advice
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'coverup', seg: [247.5, 258.7],
      stem: 'What does Leslie do with Ron’s advice to go easier on herself?',
      choices: ['She twists it into advice to cover it up', 'She asks him in earnest what to do next',
                'She agrees she’s being too hard on herself'], a: 0,
      cue: 'No. のあと、レスリーの2つの質問。',
      line: 'You’re punishing yourself more than anybody else… — No. … *You think we should cover this up?*',
      said: '「自分を罰しすぎ」と言われ、「じゃあ、もみ消せって言うの？」と返す。',
      mean: '「自分に厳しすぎる」という助言を、わざと「隠ぺいしろ」にすり替えて退ける。',
      trap: 'What do you suggest は相談に聞こえるが、反論の前ふり。続く質問で本音が分かる。',
      use: 'So what, you want me to just ignore it?（じゃあ何、放っておけって言うの？）' },

    // why: women officials ← her first video's apology list; Ron and the manager ← the two people the last scene
    //   names as able to punish her
    { id: 'd6', skill: 'detail', level: 'B1', point: 'confession', reveals: ['list'], seg: [278.95, 286.1],
      stem: 'Who will Leslie email her written confession to?',
      choices: ['Everyone in Pawnee’s government', 'Every woman in public office', 'Ron and the city manager'], a: 0,
      cue: 'emailing to のあと、文の最後まで。',
      line: 'which I will be *emailing to everyone in the entire Pawnee government*.',
      said: '「告白文を書いた。ポーニーの市役所の全員にメールで送る」と言う。',
      mean: '注意で済む件を、役所全体に知らせる。償いがどんどん大きくなっている。',
      trap: '前のビデオの「全米の女性公務員」と混ざりやすい。宛先は to のあとの everyone in…。',
      use: 'I’ll email it to the whole team.（チーム全員にメールで送るね）' },

    // R fix: V2 (blind 50 %): the rules choice was weak. Now the third option is her own apology videos.
    // why: report her ← a link inside a confession sounds like a complaint form; videos ← her video statements are
    //   what this scene follows, so a link seems to point there
    { id: 'i4', skill: 'infer', level: 'C1', point: 'pits', seg: [286.2, 292.5],
      stem: 'What does the link Leslie attaches show about her confession?',
      choices: ['It slips in some praise for herself', 'It gives people a place to report her',
                'It points people to her apology videos'], a: 0,
      cue: 'just to remind people of のあと。',
      line: 'I’ve also attached a link to the PITS webpage, just to *remind people of all the good work that I do*.',
      said: '告白文に部署のページへのリンクも付け、「私の良い仕事を思い出してもらうため」と言う。',
      mean: '謝罪の中に自分の宣伝を混ぜている。評価は落としたくない本音。',
      trap: '告白にリンクと聞くと、通報先や謝罪ビデオと思いやすい。just to のあとが目的。',
      use: 'Just a friendly reminder about Friday.（金曜の件、念のためのお知らせです）' },

    // R fix: V2 (blind 60 %): "the city" was remote. Now the near miss has the right target, Leslie, and the wrong
    //   mechanism (a word she misuses).
    // why: Ron ← "he refused" sounds like blame for not reporting a wrong: the right mechanism, the wrong target;
    //   doesn't know the word ← "whistle blow myself" heard as a slip, but she used "blow the whistle on me" rightly
    // anchor: 292.8–297.4 s "I asked Ron to blow the whistle on me and he refused… that is why I had to whistle blow
    //   myself": every clause has "I" for its subject, and a whistle-blower exposes others, so "myself" turns a
    //   confession into a brave act; 236.7 s Ron's "It's not that big a deal" is why he refused
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'whistle', reveals: ['bigdeal'], seg: [292.4, 298.3],
      stem: 'In Leslie’s last line about blowing the whistle, who is the joke on?',
      choices: ['Leslie, who makes a confession sound heroic', 'Leslie, who doesn’t know what whistle-blowing is',
                'Ron, for refusing to report a real wrong'], a: 0,
      cue: 'had to のあと、最後の語まで。',
      line: 'I asked Ron to *blow the whistle on me* and he refused. And that is why I had to *whistle blow myself*.',
      said: 'ロンに自分の内部告発を頼んだが断られ、「だから自分で自分を内部告発した」と言う。',
      mean: '内部告発は他人の不正を暴く勇気ある行い。自分の小さな違反に使うと、ただの自白を英雄的に飾る事になる。',
      trap: 'refused はロンを責めて聞こえるが、彼は大した事じゃないと言っていた。主語 I を追う。',
      use: 'So I turned myself in, so to speak.（だから、いわば自首したんだ）' },
  ]
};
