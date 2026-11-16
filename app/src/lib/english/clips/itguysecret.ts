// “The IT Guy Exposes Everyone's Secrets - The Office US” (the official The Office channel, BEST OF SEASON 6): a meeting
// is hunting for whoever leaked the printer story when Nick, the IT guy, stops in to say goodbye; nobody knows his name,
// and on his way out he reveals what he saw on their hard drives.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 4.6 s ("Gabe. I mean" / "gave
// them"), 25 s ("Fellas" / "fellows"), 54.6 s ("a story" / "the story"), 79 s ("Darryl" / "barrel") and 100.5 s
// ("leave" / "believe"); no key rests on those words. No item uses the "terrorist" (61–63 s) or "games and porn"
// (65–69 s) lines.
// EAR CHECK: 47.8 s h1 — the one-word reply after "No." is "Sport." (captions) or "It's bored." (whisper); the key
//   assumes "Sport"
// EAR CHECK: 75.4 s r1 — the cut falls after "and guess what?" (what 74.9) and before "You're not a photographer" (75.9)
// REVIEW 2026-11-16: pass 2, fix 18, drop 0, new 0; ear checks 2
import type { Clip } from '../types.ts';

export const itGuySecrets: Clip = {
  id: 'itguysecret', video: 'RFQRM1B2AKA', title: 'The IT Guy Exposes Everyone\'s Secrets', dur: 125, wpm: 172,
  band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): the goodbye choice was refuted by the stem itself; now all three pick between
    //   "Gabe or Angela"
    // why: fix printers ← the first sentence ends on "the printers" + "either Gabe or Angela" heard as choosing a
    //   person for a job; lead ← "Get her, boys" heard as rallying behind a leader
    { id: 'g1', skill: 'gist', level: 'B1', point: 'meeting', seg: [0, 35],
      stem: 'What is the meeting trying to do when Nick walks in?',
      choices: ['Work out which of them is to blame', 'Pick which of them should fix the printers',
                'Pick which of them should lead the team'], a: 0,
      cue: '最初の発言と「either … or」の文。',
      line: 'I think we all can agree that it’s *either Gabe or Angela*.',
      said: '「ゲイブかアンジェラのどちらかだ」と、誰の仕業かを話し合っている。',
      mean: '会議の目的は犯人さがし。プリンターはその件の話題。',
      trap: '最初の printers から「修理の担当決め」と取りやすい。could be you（お前かも）は犯人さがしの言い方。',
      use: 'It’s either this one or that one.（これかあれか、どっちかだ）' },

    // R fix: V2 (blind 75 %) + K1: "finally" made the "wasting your life" insult a second defensible key; the stem
    //   now asks the why at scene level, and the Detroit filler is gone
    // why: blamed ← the meeting's hunt for a culprit heard as aimed at him; talk him out of leaving ← "good luck
    //   wasting your life" heard as trying to stop the move
    { id: 'g2', skill: 'gist', level: 'B2', point: 'motive', seg: [12.5, 79],
      stem: 'Why does Nick end up exposing their secrets?',
      choices: ['They never cared enough to learn who he is', 'They blamed him for leaking the printer story',
                'They tried to talk him out of leaving'], a: 0,
      cue: '名前のやりとりと、最後のひと言。',
      said: '別れを言いに来たのに名前も覚えられておらず、最後は将来までばかにされて、秘密を暴露し始める。',
      mean: '無視され、見下されてきたことへの仕返し。暴露はその結果。',
      trap: '会議の犯人さがしや最後の皮肉に引っぱられやすい。名前のやりとりの積み重ねを追う。',
      use: 'That’s it. I’ve had enough.（もういい、うんざりだ）' },

    // R fix: V2 (blind 60 %): only the key said "teach" and "kids"; now two choices teach and two have kids
    // why: set up computers ← "computers" + "kids", heard as IT work for schools; adults ← "inner-city" heard, the
    //   weak "kids" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'detroit', seg: [15.7, 21.3],
      stem: 'What is Nick leaving to do?',
      choices: ['Teach kids in Detroit about computers', 'Set up computers in Detroit schools',
                'Teach adults in Detroit about computers'], a: 0,
      cue: '「Detroit」のあとの動詞と、その相手。',
      line: 'I’m gonna go down to Detroit and *teach inner-city kids about computers*.',
      said: 'デトロイトへ行って、都市部の子どもたちにコンピューターを教えると話す。',
      mean: '会社を辞めて、教える仕事に移るという別れのあいさつ。',
      trap: 'IT 担当なので「修理しに行く」と思いやすい。teach のあとの kids まで聞く。',
      use: 'I’m going down to Texas for work.（仕事でテキサスへ行くんだ）' },

    // R fix: V2 (blind 70 %): the key was the only one that didn't back down in an obvious way; rebalanced
    // why: come back later ← "Oh, yeah" heard as giving in; how long ← the Japanese frame: told "not now", one asks
    //   when it's convenient
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'notnow', seg: [20.7, 24.9],
      stem: 'When he’s told “Not now,” what does Nick do?',
      choices: ['Explains why it has to be now', 'Offers to come back after the meeting',
                'Asks how long the meeting will last'], a: 0,
      cue: '「Oh, yeah」のあとに続く理由。',
      line: 'Not now. — Oh, yeah, *it’s just*, uh, my friends are in the car waiting, *so I thought I would*…',
      said: '「今はだめ」と言われ、「うん、ただ友だちが車で待ってるから…」と話を続ける。',
      mean: 'Oh, yeah は同意でなく「だよね、でも」の前置き。it’s just で事情を出す。',
      trap: '日本語なら引く場面。it’s just のあとには、引かない理由が来る。',
      use: 'It’s just, my ride is waiting outside.（ただ、迎えが外で待ってて）' },

    // R fix: V2 (blind 70 %): rebalanced; "embarrassed" picks up his earlier "sorry to interrupt"
    // why: joking ← "the lame IT guy" sounds like self-mockery for a laugh; embarrassed ← "sorry to interrupt" and
    //   "I get it" heard as backing off (the Japanese 「分かりました、失礼します」)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'hates', seg: [34.8, 39.5],
      stem: 'How does Nick feel when he says “Okay, look, I get it, people”?',
      choices: ['Hurt, and tired of being brushed off', 'Embarrassed, and sorry for barging in',
                'Amused, and joking about his image'], a: 0,
      cue: '「I get it」のあとに並ぶ言葉の強さ。',
      line: 'I get it, people. I’m the *lame IT guy*, and *everybody hates me*.',
      said: '「分かってるよ。僕はさえない IT 担当で、嫌われ者だ」と言う。',
      mean: 'I get it は納得でなく「もう分かってる」という不満。傷ついている。',
      trap: 'I get it を「了解」と取ると穏やかに聞こえる。あとの言葉の強さで決める。',
      use: 'Okay, I get it. You’re busy.（はいはい、分かったよ。忙しいんだね）' },

    // R fix: V2 (blind 60 %): "take things that aren't his" was absurd; both distractors now build on "take it"
    // why: take it out on them ← take it + a phrasal ending, the adverb lost; tell the boss ← the meeting's leak
    //   topic
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'personal', seg: [37, 41.35],
      stem: 'Right after “everybody hates me”, what is Nick told not to do?',
      choices: ['See it as aimed at him', 'Take it out on them', 'Tell the boss about it'], a: 0,
      cue: '「listen, man」のあとの決まった言い方。',
      line: 'Hey, listen, man, you can’t *take it personally*.',
      said: '「なあ、気にするなよ」と声をかけられる。',
      mean: 'take it personally ＝ 自分個人への攻撃と受け取る。「気にするな」の決まり文句。',
      trap: 'take it out on（八つ当たり）と混ざりやすい。personally は受け取り方。',
      use: 'Don’t take it personally.（気にしないで）' },

    // R fix: V2 (blind 50 %): the job-title filler is now "too chummy", a reading of "man" a listener could hold
    // why: talking down ← "man" heard as a rude word; too chummy ← "man" heard as fake friendliness from people
    //   who ignore him
    { id: 'i1', skill: 'infer', level: 'B2', point: 'man', seg: [39.1, 44.3],
      stem: 'Why does Nick object to being called “man”?',
      choices: ['It shows they’ve already forgotten his name', 'He hears the word as talking down to him',
                'It sounds too chummy from people who ignore him'], a: 0,
      cue: '「man」のすぐあとの文。',
      line: 'You call me “man”? *I just said my name* just now.',
      said: '「man って呼ぶの？今、名前言ったばかりだよ」と返す。',
      mean: 'man は名前の代わり。名乗った直後なのに使われ、名前を覚えていない証拠になる。',
      trap: 'man を失礼な言葉と取りやすいが、男同士では普通の呼び方。問題は名前の代わりに使ったこと。',
      use: 'Sorry, what was your name again?（ごめん、お名前なんでしたっけ）' },

    // R fix: V2 (blind 60 %): "yet again" marked the key; the choices are now parallel and none says "again"
    // why: wrong name ← "Sport" heard as a mistaken guess at his name; asks ← the expected sitcom move, "what was it
    //   again?"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sport', reveals: ['didyou'], seg: [41.2, 48.6], retired: true,
      stem: 'Why does the reply to “Did you forget it already?” get a laugh?',
      choices: ['He says no, but uses a nickname', 'He says no, but gets the name wrong',
                'He says no, but has to ask for it'], a: 0,
      cue: '「No」のあと、少し間をおいた一語。',
      line: 'Did you forget it already? — *No.* … *Sport.*',
      said: '「忘れた？」に「いや」と答え、間をおいて「スポーツ」と呼ぶ。',
      mean: 'sport は「おい、きみ」程度の呼びかけ。忘れてないと言いつつ、また名前を避ける。',
      trap: '名前を取り違えたように聞こえやすい。sport や champ は名前を知らなくても使える。',
      use: 'Nice try, sport.（いい線いってたよ、きみ）' },

    // R fix: V2 (blind 70 %) + §9.5: "Do you forget it already?" isn't real English; "Could you" (a real, if odd,
    //   request) replaces it, next to "Would you … already?" (= drop it)
    // why: Could you ← the weak "d‿y" ≈ ジュ heard after a lost first consonant; Didn't you ← the negative question
    //   form; Would you ← only the final "d‿y" is caught, and "Would you … already?" is a real complaint
    { id: 's1', skill: 'sound', level: 'B2', point: 'didyou', seg: [42.3, 46],
      stem: 'Fill the gap: “___ forget it already?”',
      choices: ['Could you', 'Did you', 'Didn’t you', 'Would you'], a: 1,
      cue: '文の最初、二語がつながった短い音。',
      line: '*Did you* forget it already?',
      said: '「もう忘れちゃったの？」と聞いている。',
      mean: 'Did you がつながって「ディジュ」に近い音になる。d と y が合わさって「ジュ」。',
      trap: 'Didn’t なら n の音が残る。already と合うのは、今起きたことを聞く過去形。',
      use: 'Did you get my message?（メッセージ届いた？）' },

    // why: fifty ← -teen/-ty: stress on the first syllable; five ← only "-teen"'s vowel is lost in fast speech
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifteen', seg: [48.6, 52.3],
      stem: 'How many parties a week does Nick say they have?',
      choices: ['Five', 'Fifteen', 'Fifty'], a: 1, keep: true,
      cue: '「parties」の直前の数字、最後の音。',
      line: 'You guys have *15 parties a week*. You can’t learn my name?',
      said: '「週に15回もパーティーをしてるのに、名前は覚えられないの？」と言う。',
      mean: '大げさな数で、自分だけが相手にされていないことを責めている。',
      trap: 'fifteen は後ろの teen が長く強い。fifty は前が強く、ty が短い。',
      use: 'We have, like, three meetings a week.（週に3回も会議があるんだよ）' },

    // R fix: V2 (blind 65 %): the stem's irony pointed at the only ironic choice; "admitting they were wrong" is now
    //   the near miss, and it reveals h1's no-name point
    // why: admitting wrong ← "None of us have spent a lot of time getting to know you" heard as a confession; just
    //   how offices are ← "the last guy" heard as a general rule about IT staff
    // anchor: 52.3–58 s he calls Nick "IT guy" and "champ" (no name again), then says none of them has got to know him:
    //   the reply meant to set Nick straight agrees with his complaint
    { id: 'c2', skill: 'humor', level: 'C2', point: 'champ', reveals: ['know', 'sport'], seg: [52.2, 58],
      stem: 'The coworker means to set Nick straight. What does he end up doing?',
      choices: ['Backing Nick’s point, still without his name', 'Admitting they were wrong to ignore him',
                'Explaining that every office treats IT so'], a: 0,
      cue: '呼びかけの言葉と、そのあとの「None of us」。',
      line: '…*IT guy*. Here’s the story, *champ*. *None of us* have spent a lot of time getting to know you, okay?',
      said: '「IT 担当くん、いいか、チャンプ。誰もお前を知ろうとしてこなかった、な？」と言う。',
      mean: '言い返すつもりが、知ろうとしなかったと認め、呼び方も名前抜き。文句を裏づけてしまう。',
      trap: 'None of us … は反省に聞こえるが、okay? で押しつけている。相手の言い分を認めていないか聞く。',
      use: 'So, basically, you’re saying I’m right.（つまり、私が正しいってことね）' },

    // R fix: S4: the end moved from 57.95 to 58 s so "okay" (57.8 s) isn't clipped
    // dict: "getting to" shrinks to "gettin' ta"
    { id: 'x1', skill: 'dict', level: 'B1', point: 'know', seg: [55.4, 58],
      stem: 'Type it: “None of us have spent a lot of time ___.” (4 words)',
      answer: 'getting to know you',
      cue: '「a lot of time」のすぐあと。',
      line: 'None of us have spent a lot of time *getting to know you*, okay?',
      said: '「誰もお前のことを知ろうと時間を使ってこなかった」と言う。',
      mean: 'get to know ＝ 少しずつ知り合う。getting to が「ゲリンタ」とつながる。',
      trap: 'getting の t が弾み、to は弱く「タ」。know you は一続き。',
      use: 'I’m still getting to know the area.（まだこのあたりに慣れてないんだ）' },

    // R fix: N1: the line said "liked"; both sources hear "like"
    // why: kept secrets ← "kept… to himself" heard as keeping things secret; kept computers working ← "kept" + the IT
    //   job
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'kept', seg: [55.4, 61.3],
      stem: 'Why, he says, did they like the last IT guy?',
      choices: ['He stayed quiet and left everyone alone', 'He kept all their secrets to himself',
                'He kept their computers running well'], a: 0,
      cue: '「because」のあと、himself で終わる言い方。',
      line: 'We like the last guy… because he *kept to himself*',
      said: '「前の人は好きだった。人と関わらなかったから」と言う。',
      mean: 'keep to oneself ＝ 人付き合いせず静かにする。邪魔にならない人が良かった。',
      trap: 'keep … to oneself（秘密にする）と形が似る。目的語がなければ「人と関わらない」。',
      use: 'My neighbor mostly keeps to himself.（隣の人はあまり人付き合いしない）' },

    // R fix: V2 (blind 65 %): "Sarcastically" was the obvious label; all three are now manners of speaking, and the
    //   near miss is cool indifference
    // why: politely ← "thank you" taken at face value, as leaving on good terms; coolly ← "Thank you so much" said
    //   flat, heard as not caring (the Japanese frame: 大人の対応)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'thanks', seg: [68.85, 73.3],
      stem: 'When Nick answers the “good luck” remark, how does he mean his thanks?',
      choices: ['Bitterly: the insult is the last straw', 'Politely: he wants to leave on good terms',
                'Coolly: he is above caring what they say'], a: 0,
      cue: '直前の「good luck」のあとに続く言葉。',
      line: '…so *good luck wasting your life*, lurch. — *Thank you so much* for that.',
      said: '「人生を無駄にがんばれよ」と言われ、「どうもありがとう」と返す。',
      mean: '侮辱へのお礼は皮肉。このあと暴露が始まり、怒りの合図と分かる。',
      trap: 'good luck だけ聞くと励ましに聞こえる。うしろの wasting your life までがひとかたまり。',
      use: 'Wow, thanks for that.（へえ、それはどうも）' },

    // R fix: V2 (blind 80 %): "I saw all your hard drives" made the key the only choice about their files; all three
    //   now follow from the hard drives
    // why: viruses ← the IT guy's usual news about hard drives; dull files ← "guess what?" heard as setting up a joke
    // predict: the segment stops after "guess what?"; then plays the first reveal
    { id: 'r1', skill: 'predict', level: 'B2', point: 'drives', seg: [71.3, 75.4], then: [75.4, 78.95], retired: true,
      stem: 'Right after “and guess what?”, what kind of thing does Nick say?',
      choices: ['Something embarrassing he found on them', 'A warning that their computers have viruses',
                'A joke about how dull their files are'], a: 0,
      cue: '「guess what」の直前に何を見たと言ったか。',
      line: 'I saw *all your hard drives*, and guess what? *You’re not a photographer*…',
      said: '「全員のハードディスクを見たけど、なんと…」と言い、秘密を明かす。',
      mean: 'guess what? は意外な話の予告。直前の hard drives から、中身の暴露と分かる。',
      trap: 'IT 担当なのでウイルスの話と思いやすい。直前の怒りが中身を決める。',
      use: 'Guess what? I got the tickets.（ねえ聞いて、チケット取れた）' },

    // R fix: V2 (blind 50 %): the key and its mirror are now the same shape, so only the order of on/not settles it
    // why: not on it ← the second "not on Facebook" is the last heard; ignores requests ← "People want to be your
    //   friend" heard as unanswered friend requests
    { id: 'd4', skill: 'detail', level: 'B2', point: 'facebook', seg: [78.95, 84.6],
      stem: 'What does Nick reveal about one coworker and Facebook?',
      choices: ['He’s on it, but says he isn’t', 'He’s not on it, but says he is',
                'He’s on it, but ignores friend requests'], a: 0,
      cue: '二回出てくる Facebook の、前と後の違い。',
      line: '…*you’re on Facebook*. Why you been *telling people you’re not*…?',
      said: '「Facebook やってるのに、なんでやってないって言うの？」と言う。',
      mean: '実はやっているのに、同僚には「やってない」とうそをついていた。',
      trap: '最後の not on Facebook が耳に残りやすい。前の you’re on とつなげる。',
      use: 'Why have you been telling people that?（なんでそんなこと言いふらしてたの？）' },

    // why: have been ← grammar adds the missing "have"; are you ← the question word pattern "Why are you telling…"
    // anchor: 80.7–81.4 s both sources: "why you been telling", no "have" (the captions' words at 80.7, 80.9, 81.0, 81.1)
    { id: 'c1', skill: 'dict', level: 'C2', point: 'facebook', seg: [80.4, 82.8],
      stem: 'Type the start: “___ people you’re not on Facebook?” (4 words)', answer: 'why you been telling',
      cue: '「on Facebook」のすぐあと。文法より、聞こえた音を。',
      line: '*Why you been telling* people you’re not on Facebook?',
      said: '「なんでやってないなんて言ってたんだ？」と聞く。have がなく、4語が速くつながる。',
      mean: '会話では Why have you been の have が落ち、Why you been にな���ことがある。',
      trap: '文法どおり have を足したくなる。書き取りは、聞こえた語を書く。',
      use: 'Where you been all day?（一日どこにいたの？）' },

    // why: video ← "QuickTime movie" comes right after, heard as what he sent; phoned ← "told the press" heard as a
    //   call
    // R fix: N7/C5: the line and stem state who told the press, i2's key and f3's meaning; added reveals
    { id: 'd5', skill: 'detail', level: 'B1', point: 'email', reveals: ['proof', 'snitch'], seg: [84.6, 90.2],
      stem: 'According to Nick, how did “this guy” reach the press?',
      choices: ['He wrote an email to the editor', 'He sent the editor that video',
                'He called the editor from his desk'], a: 0,
      cue: '「told the press」の次の文。',
      line: 'you’re the one who told the press. You *wrote an e-mail to the editor*.',
      said: '「マスコミに話したのはお前だ。編集者にメールを書いた」と言う。',
      mean: 'press ＝ 報道機関。情報をもらした方法を、メールだと具体的に言っている。',
      trap: 'すぐあとの movie を送ったものと取りやすい。動画は「見た」もので、送ったのはメール。',
      use: 'I wrote an email to the manager.（店長にメールを書きました）' },

    // R fix: V2 (blind 65 %): the key echoed "told the press"; it now says "the leak", and the new distractor is a
    //   threat a revenge scene invites
    // why: printers catch fire ← a "fire test" heard as proof the printers burn; leak too ← "told the press" +
    //   "movie" heard as Nick threatening to send it
    { id: 'i2', skill: 'infer', level: 'C1', point: 'proof', reveals: ['snitch'], seg: [89.5, 96],
      stem: 'Why does Nick bring up the video on “this guy’s” hard drive?',
      choices: ['To back up his claim about the leak', 'To show the printers really catch fire',
                'To show he could leak things too'], a: 0,
      cue: '動画の話のすぐあとの短い二文。',
      line: 'I also saw a QuickTime movie of your little *printer fire test*… *This guy’s a snitch*.',
      said: '「プリンター発火テストの動画も見た」と言い、「こいつが密告者だ」と続ける。',
      mean: '動画は証拠。会議で探していた人が誰か、これで答えが出る。',
      trap: 'fire test からプリンターの危険の話と取りやすい。直後の This guy’s が話の向き先。',
      use: 'I have proof. I saw it myself.（証拠はある。この目で見た）' },

    // R fix: V2 (blind 75 %): "lied" was weak; "spied on" is the near miss (Nick is the one who looked)
    // why: stole ← "snitch" sounds like "snatch" (ひったくる); spied ← the hard-drive snooping just described
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'snitch', seg: [92.4, 96], retired: true,
      stem: 'What is Nick calling “this guy” at the end?',
      choices: ['Someone who told on the group', 'Someone who stole from the group', 'Someone who spied on the group'],
      a: 0,
      cue: '最後に二回くり返す一語。',
      line: 'This guy’s a *snitch*. He’s the snitch.',
      said: '「こいつが密告者だ。こいつがチクったんだ」と二度言う。',
      mean: 'snitch ＝ 仲間のことを上や外にもらす人。日本語の「チクり屋」に近い。',
      trap: 'snatch（ひったくる）と音が近く、盗みと取りやすい。snitch は「告げ口」。',
      use: 'Don’t be a snitch.（チクるなよ）' },
  ]
};
