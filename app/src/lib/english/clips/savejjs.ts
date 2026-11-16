// REVIEW 2026-11-16: pass 8, fix 15, drop 1, new 0; ear checks 2
// “The Mission To Save Breakfast Food | Parks and Recreation” (the official Parks and Recreation channel, Season 7):
// Leslie has lost a land deal and hears that JJ's diner is closing too; after a talking head on how Pawnee has changed,
// she decides to fight for the diner, plans a public rally, recruits April, Andy and Ron, and Ron gives a short speech
// for breakfast food.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 188 s; music after. Names said: JJ, April,
// Andy, Ron. Leslie is never named, so her lines are taken from the scene (she runs the rally, asks April/Andy/Ron); the
// free-market line at 43 s is taken as Ron's (JJ answers it). No who items. Untested on purpose: 7.8–11 s ("voodoo"
// aside, speaker unknown), 57 s ("Can't win them all", speaker unknown), 82–92 s (whisper "Voldemort Putin" vs captions
// "Putin… Putin"; a world leader and "that bastard"; the company name), 115–120 s (Andy's blimp, "Johnny Karate"
// backstory), 131–141 s (chanting).
// EAR CHECK: 33.0 s x1 — "losing some of its" runs together (both sources have the four words)
// EAR CHECK: 113.1 s s1 — "you thinking", with no "are" before it (both sources)
import type { Clip } from '../types.ts';

export const saveJJs: Clip = {
  id: 'savejjs', video: 'KM-unaWrilI', title: 'The Mission To Save Breakfast Food', dur: 211, wpm: 156,
  band: 'slow', tags: ['店・レストラン', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: $100,000 ← "hundred" heard without "million"; $25 million ← "25" is said first, but it's the square miles
    { id: 'n1', skill: 'number', level: 'B1', point: 'value', seg: [0, 6.5], keep: true,
      stem: 'What is the land said to be worth?',
      choices: ['$100,000', '$25 million', '$100 million'], a: 2,
      cue: '「valued at」のすぐあと。',
      line: 'valued at *100 million dollars*',
      said: '土地の価値は1億ドル、と言っている。',
      mean: 'valued at ＋金額 ＝「〜の価値がある」。それをタダでほしかった、という話。',
      trap: '先に聞こえる 25 は面積。数字のすぐあとの単位までセットで聞く。',
      use: 'It’s valued at about two million.（約200万の価値がある）' },

    // R fix: V2 (blind 65 %, right): the key was the only ironic choice. All three now share "makes a huge X sound
    //   like…"; cue no longer names "for free" (a word only the key's idea carries).
    // why: fair deal ← "valued at 100 million" heard as a price and "too much to ask?" as "too much to pay?"; yard ←
    //   "25 square miles" heard as what she shrinks, not the request
    { id: 'h1', skill: 'humor', level: 'C1', point: 'askfree', reveals: ['value'], seg: [0, 11.5],
      stem: 'What makes the opening line funny?',
      choices: ['She makes a huge free gift sound like a small wish', 'She makes a huge price sound like a fair deal',
                'She makes a huge piece of land sound like a yard'], a: 0,
      cue: '長い一文のあとの、短い質問の形。',
      line: '…valued at 100 million dollars, *given to me for free*. *Is that too much to ask?*',
      said: '「1億ドルの土地をタダで。それって望みすぎ？」と言う。',
      mean: '「ささやかな願いでしょ」という決まり文句を、巨大な要求に使うのが笑い。',
      trap: 'for free なので値段の話ではない。質問の形でも「いいえ」を期待する言い方。',
      use: 'Is that too much to ask?（そんなに無理なお願い？）' },

    // R fix: V2 (blind 60 %, right): both distractors were outside events, the key the only inner reason. One
    //   distractor is now an inner reason too (stop all change), refuted by "happy with some of the changes".
    // why: stop all change ← "Everything is changing… unrecognizable" heard as her motive; JJ asks ← she might want JJ
    //   to ask, but he only takes the order and talks about the lease
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['damned', 'closing', 'waffles'], seg: [10.4, 66.3],
      stem: 'What turns her from “It’s over” to fighting back?',
      choices: ['She won’t lose the diner on top of the land', 'She wants to stop the town from changing at all',
                'JJ asks her to help him keep the diner open'], a: 0,
      cue: '最後の「No.」のあと、何と何を比べているか。',
      line: '*Enough is enough.* They may have taken that land, but…',
      said: '土地は取られたが、店まで取らせない、ともう我慢しないと決める。',
      mean: '大きな負けのあとに、好きな店まで失うのは許せない。それで「戦う」側に変わる。',
      trap: 'JJ は頼んでいないし、町の変化には満足な面もあると話している。決め手は土地に続いて店まで、という点。',
      use: 'Enough is enough. I’m calling them.（もう我慢しない。電話する）' },

    // R fix: V2 (blind 70 %, right; the title points at a threat): distractors now come from the lines just before
    //   ("unrecognizable in 10 years") and from "Even" read as an exception.
    // why: ten years ← "unrecognizable in 10 years" heard about the diner itself; stay the same ← "Even JJ's diner…"
    //   heard as "except JJ's", with the last word lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'closing', seg: [12.8, 18.75],
      stem: 'What does she say is happening to JJ’s diner?',
      choices: ['It will soon be gone for good', 'It will look different in ten years', 'It will stay just as it is'], a: 0,
      cue: '「Even JJ’s diner」のあと、最後の長い一語。',
      line: 'Even JJ’s diner is *disappearing*.',
      said: '「JJ’s ダイナーまでなくなる」と言っている。',
      mean: 'disappear ＝ 消える。ここでは閉店のこと。Even で「あの店まで」という驚き。',
      trap: 'Even は「〜まで」。直前の unrecognizable に引かれず、最後の一語を聞く。',
      use: 'Even my favorite café is closing.（お気に入りのカフェまで閉店する）' },

    // R fix: V2 (blind 50 %, right): all three now start "As many as…"; the last-order filler is now "fill us up".
    // why: left ← "however many" heard as "how many are left"; fill them up ← "it takes to" heard, "keep you in
    //   business" lost (the usual "as much as it takes to fill me up")
    { id: 'i1', skill: 'infer', level: 'B2', point: 'waffles', reveals: ['closing'], seg: [18.3, 22.4],
      stem: 'When JJ asks what they would like, what does the reply mean?',
      choices: ['As many as it takes to keep him open', 'As many as he has left before he closes',
                'As many as it takes to fill them up'], a: 0,
      cue: '「waffles」のあと、「business」で終わる部分。',
      line: '*However many waffles it takes to keep you in business*.',
      said: '「店が続くだけ、何枚でも」と注文する。',
      mean: '注文の形で「応援する」と言っている。食べて店を救う、という冗談まじりの本気。',
      trap: 'however many を「何枚残ってる？」と取りやすい。it takes to 〜 は「〜に必要なだけ」。',
      use: 'Whatever it takes to fix it.（直るなら何でもする）' },

    // R fix: V2 (blind 55 %, right): the "old shops" filler is out; the new distractor takes "happy with some of the
    //   changes" as all of them, so "some" and "But" decide.
    // why: costs more ← "standard of living is up" heard as "cost of living"; every change ← "some" lost and the "But"
    //   line missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'changes', reveals: ['charm'], seg: [22.2, 36.45],
      stem: 'In the talking head, how does she feel about the town’s changes?',
      choices: ['Glad life is better, sorry it feels less special', 'Glad life is better, worried it costs more now',
                'Glad life is better, happy with every change'], a: 0,
      cue: '前半の happy と、「But」のあとを比べて。',
      line: 'I’m *happy with some of the changes*… But I think the town is *losing some of its charm*.',
      said: '「暮らしは良くなったけど、町らしさが少し消えてきた」と話す。',
      mean: '良い面を認めてから but で本音。気持ちは半々で、さびしさが残る。',
      trap: 'standard of living を「物価」と取ると「心配」に流れる。but のあとが本音。',
      use: 'I miss the old place, though.（でも前の店が恋しい）' },

    // why: corrects ← "I mean" is often a self-correction; complain ← her "but" comes a few lines later
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['changes'], seg: [22.2, 31.2],
      stem: 'Right after “happy with some of the changes”, what does her next phrase do?',
      choices: ['It leads into examples of the good side', 'It corrects what she has just said',
                'It shows she is about to complain'], a: 0,
      cue: '「gone through」のすぐあと、短い二語。',
      line: 'I’m happy with some of the changes… *I mean*, the standard of living is up.',
      said: '「良い変化もある。つまり、暮らしの水準は上がったし…」と例を挙げる。',
      mean: 'この I mean は言い直しではなく「というのは」。前の一言を具体例で広げる。',
      trap: 'I mean は訂正にも使うが、ここは前の内容を否定していない。後ろが例なら説明の合図。',
      use: 'It’s fine. I mean, it works.（まあいいよ。ちゃんと動くし）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'charm', seg: [31.1, 34.25],
      stem: 'Type what she says: “But I think the town is ___ charm.” (4 words)', answer: 'losing some of its',
      cue: '「the town is」のあと、「charm」の前。',
      line: 'But I think the town is *losing some of its* charm.',
      said: '「でも、町の魅力が少し失われている」と言っている。',
      mean: 'some of its が「サマヴィッツ」のようにつながる。of は「ア」程度に弱くなる。',
      trap: 'of と its が弱く、二語に聞こえやすい。some のあとに小さな音が二つあると思って聞く。',
      use: 'The show is losing some of its fans.（その番組はファンが少し離れている）' },

    // R fix: V2 (blind 65 %, right): parallel "She treats…" choices; the money filler is out.
    // why: tasty treat ← "asked me if I wanted kale" heard as a new thing she liked; staff ← "you guys" heard as her
    //   scolding the shop's staff, though "One place asked me" is a story told afterwards
    { id: 'h2', skill: 'humor', level: 'C1', point: 'kale', seg: [33.8, 42.9],
      stem: 'In the talking head, what makes the milkshake bit funny?',
      choices: ['She treats a small food change as a real outrage', 'She treats a kale milkshake as a tasty new treat',
                'She treats the camera crew as the shop’s staff'], a: 0,
      cue: '同じ言葉をくり返す、その言い方。',
      line: 'One place asked me if I wanted kale in my milkshake. *My milkshake, you guys.*',
      said: '「ミルクシェイクにケールを入れるかと聞かれた。ミルクシェイクによ！」とくり返す。',
      mean: '町が変わった証拠が、シェイクのケール。小さな事を大事件のように訴えるのが笑い。',
      trap: 'you guys は聞き手への呼びかけ。くり返しは「信じられない」という強調。',
      use: 'They put sugar in my coffee. My coffee!（コーヒーに砂糖だよ、信じられる？）' },

    // anchor: 43.4–51.5 s "your failure as a businessman is ultimately to blame, it's still a travesty your diner is
    //   closing": the fault named first, the regret after "still"
    // why: market ← "firm believer in the free market" heard as naming the cause; no loss ← the blame heard and the
    //   "still a travesty" missed (sympathy dropped)
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'blame', reveals: ['closing'], seg: [42.9, 51.55],
      stem: 'Which plain-English version keeps what Ron says to JJ?',
      choices: ['“It’s your own fault, but it’s still a shame.”', '“It’s the market’s fault, and that’s a shame.”',
                '“It’s your own fault, so it’s no real loss.”'], a: 0,
      cue: '「to blame」のあと、文の後半。',
      line: 'your *failure as a businessman is ultimately to blame*, it’s *still a travesty* your diner is closing.',
      said: '「悪いのは君の経営だ。それでも閉店はひどい話だ」と言う。',
      mean: '同情の言葉の中で、相手の責任をはっきり言う。市場は信じる対象で、原因として責めてはいない。',
      trap: 'free market を原因と聞きやすい。even though と still が組なら、両方とも本心として聞く。',
      use: 'It’s partly your fault, but I’m still sorry.（君のせいもあるけど、気の毒に思う）' },

    // R fix: V2 (blind 65 %, right): the literal "cursed" filler is out; the three choices are parallel, and "give
    //   up" (damned heard as doomed) is the new near miss.
    // why: shocked ← "Well, I'll be damned!" is also a cry of surprise; give up ← damned heard as doomed (もうだめ)
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'damned', seg: [59.4, 66.3],
      stem: 'When Leslie brings up her waffles, what does she mean?',
      choices: ['She won’t let them take the diner as well', 'She’d be shocked if they took the diner as well',
                'She’d give up if they took the diner as well'], a: 0,
      cue: '「but」のあと、「if」に続く部分。',
      line: 'They may have taken that land, but *I will be damned if they take my waffles*.',
      said: '「土地は取られても、ワッフルは取らせない」と言う。',
      mean: 'I’ll be damned if 〜 ＝「〜なんて絶対させない」。強い決意の言い方。',
      trap: 'I’ll be damned! だけなら驚きの声。if が続くと「絶対に〜させない」になる。',
      use: 'I’ll be damned if I pay that much.（そんな額、絶対払わない）' },

    // R fix: V2 (blind 50 %, right): "Let me think about that" was a filler; now "figure out who", refuted because
    //   they already have the name.
    // why: never guessed ← the reply heard as surprise; figure out who ← figure = 考える (figure out)
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'figures', seg: [95.0, 99.45],
      stem: 'Right after “The cologne guy?”, what does the reply mean?',
      choices: ['“That’s just what I’d expect.”', '“I’d never have guessed him.”', '“Let me figure out who.”'], a: 0,
      cue: '「Oh」のすぐあとの一語と、その後の評価。',
      line: 'Oh, *figures*, that guy’s the worst.',
      said: '「やっぱりね、あいつは最低」と言う。',
      mean: 'Figures. ＝「だと思った」。悪い予想が当たったときの、あきれた一言。',
      trap: 'figure out の「考える」や、驚きの声と取りやすい。後ろの the worst が評価の答え。',
      use: 'It’s raining again? Figures.（また雨？だと思った）' },

    // why: court ← landlord and lease talk sounds legal; online ← "communication young people are using" comes next
    { id: 'd4', skill: 'detail', level: 'B1', point: 'rally', seg: [99.9, 104.1],
      stem: 'How does Leslie plan to take on the new owner?',
      choices: ['With a public rally', 'With a court case', 'With an online campaign'], a: 0,
      cue: '「old-fashioned」のあと。',
      line: 'We are gonna take him down with an old-fashioned *public rally*.',
      said: '「昔ながらの集会で、あいつを倒す」と言う。',
      mean: 'rally ＝ 人を集めて訴える集会。take 〜 down ＝ 相手を負かす。',
      trap: '次に若者の連絡手段の話が来るので「ネット」に引かれやすいが、方法は集会。',
      use: 'There’s a rally downtown on Saturday.（土曜に街で集会がある）' },

    // R fix: V2 (blind 60 %, right): the "beneath her" filler is out; "refuses, while teasing" now pairs with the key,
    //   so "I'm on it" decides.
    // why: refuses ← the teasing heard and "I'm on it" missed; explains ← the scrolls taken as a real method
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'foxes', seg: [103.9, 112.7],
      stem: 'How does April answer Leslie’s request?',
      choices: ['She agrees, while teasing how Leslie put it', 'She refuses, while teasing how Leslie put it',
                'She agrees, and explains how young people do it'], a: 0,
      cue: '「these days」への返事と、最後の短い一言。',
      line: '…young people are using these days. — Oh yeah, *tiny rolled-up scrolls delivered by trained foxes*. *I’m on it.*',
      said: '若者の連絡手段でと頼まれ、「キツネが運ぶ巻物ね。了解」と返す。',
      mean: 'ありえない方法で、年寄りじみた頼み方をからかう。I’m on it で引き受けている。',
      trap: '中身はありえない方法。最後の一言で、断っていないと分かる。',
      use: 'Sure, I’ll send it by carrier pigeon.（はいはい、伝書バトで送るね）' },

    // anchor: 104.2–112.6 s Leslie's "whatever method of communication young people are using these days", then
    //   "tiny rolled-up scrolls delivered by trained foxes. I'm on it.": an impossible method plus a yes
    // R fix: V2 (blind 50 %, right): "too busy" was weak; now "Oh yeah… I'm on it" heard as eagerness.
    // why: sincere ← the scrolls taken as a real plan (the fluent learner hears an app name she doesn't know); love
    //   this job ← "Oh, yeah… I'm on it" heard as eager, the mockery missed
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'foxes', seg: [103.9, 112.7],
      stem: 'Which reply from Leslie would show she got April’s point?',
      choices: ['Fine, I know I sound like a grandma.', 'Great. How soon can the foxes go out?',
                'Thanks. I knew you’d love this job.'], a: 0,
      cue: '頼み方の言葉と、返ってきた方法の差。',
      line: '…*whatever method of communication young people are using these days*. — Oh yeah, tiny rolled-up scrolls…',
      said: '「若者が最近使う連絡手段で」と頼むと、エイプリルは「キツネが運ぶ巻物ね」と返す。',
      mean: 'ありえない方法で、古めかしい頼み方をからかう皮肉。分かったなら、自分の言い方の古さを認める返事が合う。',
      trap: '方法に返すと皮肉を本気に取ったことになる。返事は言葉の形でなく、相手のしたことに返す。',
      use: 'Okay, okay, I’m old. I get it.（はいはい、年寄りですよ。分かった）' },

    // why: "are you" ← the full question grammar puts "are" back; "you think" ← the -ing is short and easy to miss
    { id: 's1', skill: 'sound', level: 'B2', point: 'thinking', seg: [112.6, 116.6],
      stem: 'Fill the gap: “Andy, ___ what I’m thinking?”',
      choices: ['you thinking', 'are you thinking', 'you think'], a: 0,
      cue: '「Andy」のすぐあと、最初の音。',
      line: 'Andy, *you thinking* what I’m thinking?',
      said: '「アンディ、同じこと考えてる？」。are は言っていない。',
      mean: '会話では Are you 〜ing? の are が落ち、You thinking …? になりやすい。',
      trap: '文法どおり are を補いたくなる。聞こえた音だけで判断する。',
      use: 'You coming with us tonight?（今夜一緒に来る？）' },

    // why: no ← "can't think of anything" heard as a refusal (negation up front); too silly ← breakfast food as a
    //   "noble" cause heard as mockery
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'noble', seg: [120.85, 131.4],
      stem: 'How does Ron answer Leslie’s “dynamic duo” invitation?',
      choices: ['He says yes; it’s a cause worth fighting for', 'He says no; it isn’t worth fighting over',
                'He jokes that it’s too silly to fight for'], a: 0,
      cue: '「can’t」で始まる文の、最後まで。',
      line: 'I *can’t think of anything more noble* to go to war over than bacon and eggs.',
      said: '「ベーコンと卵ほど戦う価値のある物はない」。',
      mean: 'can’t think of anything more 〜 than X ＝「X が一番〜」。否定の形で強い賛成。',
      trap: '文頭の can’t で断りに聞こえやすい。than まで聞くと意味が決まる。',
      use: 'I can’t think of anything better.（これ以上のものはない）' },

    // why: 14 ← "forty-one" with weak stress heard as -teen; 40 ← the "one" is short and easy to drop
    { id: 'n3', skill: 'number', level: 'B1', point: 'years41', seg: [141.0, 146.3], keep: true,
      stem: 'How long has JJ’s diner been part of Pawnee?',
      choices: ['14 years', '40 years', '41 years'], a: 2,
      cue: '「for」のあと、「years」の前。',
      line: 'JJ’s diner has been a part of Pawnee for *41 years*.',
      said: '「41年間、町の一部だった」と集会で話す。',
      mean: 'has been 〜 for ＋期間 ＝「ずっと〜」。長い歴史で支持を集める。',
      trap: 'forty は前が強く、fourteen は後ろが強い。後ろの短い one も落とさない。',
      use: 'We’ve lived here for twenty-one years.（ここに21年住んでいる）' },

    // R fix: V2 (blind 60 %, right): "heard it wrong" was weak; now "She knows, and admits she got carried away",
    //   parallel with the key, refuted by the unapologetic "You stick to the breakfast".
    // why: modest ← the Japanese frame: a denial after praise heard as 謙遜; carried away ← "It's called constructing a
    //   narrative" heard as an admission
    { id: 'i4', skill: 'infer', level: 'C1', point: 'narrative', seg: [146.1, 156.1],
      stem: 'When JJ says “That’s not true,” what does Leslie’s reply show?',
      choices: ['She knows, but the story works better this way', 'She thinks JJ is only being modest about it',
                'She knows, and admits she got carried away'], a: 0,
      cue: '「It’s called」のあとの言葉。',
      line: 'built that diner… with his own two hands. — That’s not true. — It’s called *constructing a narrative*, JJ.',
      said: '「自分の手で建てた」に JJ が「違う」と言い、彼女は「物語づくりよ」と返す。',
      mean: '事実でないと知りつつ、集会向けに話を盛っている。悪びれず認めるのが可笑しい。',
      trap: '「謙遜しないで」に聞こえやすいが、本人が事実を否定している。',
      use: 'Don’t let facts ruin a good story.（事実で良い話を壊さないで）' },

    // R fix: V2 (blind 50 %, right): the choices are now all "Tells him…".
    // why: cook ← "stick to the breakfast" read as a job for right now; kitchen ← the pair of jobs heard as her promise
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'stickto', seg: [151.0, 156.1],
      stem: 'What does Leslie’s last line to JJ at the rally do?',
      choices: ['Tells him to leave the talking to her', 'Tells him to go and cook for the crowd',
                'Tells him she’ll keep out of his kitchen'], a: 0,
      cue: '「JJ,」のあと、二人の役割を分ける言い方。',
      line: '*You stick to the breakfast, I’ll deal with the politics.*',
      said: '「あなたは朝食担当、政治は私がやる」と言う。',
      mean: 'stick to 〜 ＝「〜だけやっていて」。話に口を出さないで、という役割分担。',
      trap: 'breakfast を今すぐの仕事と取りやすいが、ここは「専門はそっち」という意味。',
      use: 'You stick to the driving. I’ll navigate.（運転に集中して。道案内は私）' },

    // R fix: V2 (blind 75 %, right; the title says "breakfast food"): all three choices now name the food, so the
    //   title can't pick; what decides is "and that's all" against history (Leslie's intro) and people ("most of you").
    //   Now reveals `dislike`, since the people choice is refuted by h6's key.
    // why: history ← Leslie's intro, "a man who knows the value of things staying the same"; people ← "I do not like
    //   most of you" heard with the "not" lost
    { id: 'g2', skill: 'gist', level: 'B1', point: 'speech', reveals: ['closing', 'dislike'], seg: [164.9, 188.6],
      stem: 'What is Ron’s reason for supporting the diner?',
      choices: ['Just the food, which is very good', 'The food, and the diner’s long history',
                'The food, and the people who eat there'],
      a: 0,
      cue: '「so it should remain open」の前。',
      line: 'JJ’s has *very good breakfast food*, so it should remain open.',
      said: 'ロンは「朝食がうまい。だから店は残すべき」と理由を一つだけ言う。',
      mean: '町の歴史や人のためではなく、食べ物が理由。ロンらしい、短く正直な演説。',
      trap: '町の歴史は紹介役の言葉で、人については逆のことを言う。so の前だけが理由。',
      use: 'The coffee’s good, so I keep coming.（コーヒーがおいしいから通っている）' },

    // R fix: V2 (blind 70 %, right): parallel "He tells the crowd…" choices; "likes most of them" (the "not" lost)
    //   replaces the rallies/speeches filler.
    // why: can't see ← "from this vantage point" heard as a complaint about the view; likes ← "I do not like most of
    //   you" heard with the "not" lost
    { id: 'h6', skill: 'humor', level: 'C1', point: 'dislike', seg: [165.0, 171.4],
      stem: 'What makes the start of Ron’s speech funny?',
      choices: ['He tells the crowd he doesn’t like most of them', 'He tells the crowd he can’t see most of them',
                'He tells the crowd he likes most of them'], a: 0,
      cue: '二度目の「I do not」の後ろ。',
      line: 'I do not like rallies, and… from this vantage point, *I do not like most of you*.',
      said: '「集会も、ここから見る君たちの大半も好きじゃない」と言う。',
      mean: '支持を集める場で、聴衆を嫌いと言い切る。正直すぎるのが笑い。',
      trap: 'vantage point は「見える位置」で、見えないという話ではない。not like の not を落とさない。',
      use: 'From where I stand, it looks fine.（私から見る限り、問題なさそう）' },

    // R drop: nt1 (V2/V3, C2 stress): blind 70 %, right. The key (stress on "do" in "What I do like") follows from
    //   the grammar of emphatic do, so it tests a rule, not the ear; a rewrite with "like" as a near miss would still
    //   be picked from grammar. Never shipped, so deleted.

    // R fix: V2 (blind 65 %, right): parallel "This one shared view…" choices.
    // why: a start ← "begin" heard as "start with this one"; talk later ← "do not approach me… talk to me" with the
    //   "not" lost
    { id: 'i5', skill: 'infer', level: 'B2', point: 'similar', seg: [179.0, 186.95],
      stem: 'At the end of his speech, what is Ron telling the crowd?',
      choices: ['This one shared view is all they have in common', 'This one shared view is a start to more in common',
                'This one shared view is worth talking over later'], a: 0,
      cue: '「begin and end」のあと。',
      line: 'Please *do not approach me* on the street… Our similarities *begin and end with this single issue*.',
      said: '「街で話しかけないで。共通点はこの件だけ」と言う。',
      mean: 'begin and end with 〜 ＝「〜だけ」。今回は味方でも、仲間になる気はないと線を引く。',
      trap: 'begin だけ聞くと「始まり」に聞こえる。and end まで聞いて範囲を決める。',
      use: 'My cooking skills begin and end with toast.（料理の腕はトーストだけ）' },
  ]
};
