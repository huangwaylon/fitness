// REVIEW 2026-11-16: pass 4, fix 17, drop 1, new 0; ear checks 10
// REVIEW Q: n1 dropped (Six Million Dollar Man is world knowledge); the bank now has no number item, as the clip has
//   no other number. Fine to leave it that way?
// REVIEW Q: form items (p2, p3, pr1) were judged on cues in the choices, not on a fluent reader knowing the chunk.
// “Phoebe Runs Like Kermit the Frog | Friends” (the official Friends channel, Best of Season 6): Rachel is embarrassed
// by how Phoebe runs, dodges her with a fake injury, gets caught, and finally tries running Phoebe's way.
// Segments from the captions, words from whisper (2026-11-16). Whisper repeats one line from 213 s on (hallucination);
// 213–263 s rests on the captions alone.
// EAR CHECK: 51.4 s m1 d1 — “I mean, I live with her” (both agree); speaker assumed Rachel
// EAR CHECK: 63.2 s s1 — “I don't think I can ever run again”: “can” weak /kən/, not “can't” (both: can)
// EAR CHECK: 72.0 s h1 — speakers assumed: Monica “I'm sorry that I hurt your ankles”, Rachel “Ankle.”, Monica
//   “We'll see.” (captions put “see” at 85.0 s after music, whisper at 75.0–76.3 s; seg ends 77.0 s)
// EAR CHECK: 89.5 s x1 — captions “sneak out out”, whisper “and sneak out.”; answer “sneak out”
// EAR CHECK: 101.0 s a1 — Phoebe's “Please, Rachel. I am not an idiot.”: hurt and not fooled (tone)
// EAR CHECK: 117.5 s a2 — Rachel's apology sounds sincere (tone); whisper timings drift ~5 s here, captions used
// EAR CHECK: 128.4 s s2 — “what should you have done”: should‿you‿have reduced (both agree on the words)
// EAR CHECK: 178.0 s h2 — “I am not uptight, man” is a tense shout (tone); captions also have a stammered “not up”
// EAR CHECK: 206.3 s h3 — “Satan… the neighbor's dog”: whisper puts “dog” at ~212 s, captions at 231.4 s (after music)
// EAR CHECK: 232–243 s g2 — captions only (whisper hallucinates here); speaker of “this feels great… I feel so free” assumed Rachel
// NOTE: 193 s captions “I'm more freak”, whisper “I'm more free”; no item uses that line.
import type { Clip } from '../types.ts';

export const phoebeRuns: Clip = {
  id: 'phoebe-runs', video: 'uKfPu5UgzDE', title: 'Phoebe Runs Like Kermit the Frog', dur: 263, wpm: 163, band: 'mid',
  tags: ['友だち', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R drop: n1 (number, "six ___-dollar man"): V1. "The Six Million Dollar Man" is a TV title, so the key comes from
    //   world knowledge (blind pass 95 %), and the captions themselves hear "billion". Never shipped, so deleted.
    //   The clip has no other number, so no number item is required.

    // R fix: blind pass 55 %; "can't keep up" replaced with the reading the scene invites (fix Phoebe's running).
    //   Distractor 3 says they live together, so it reveals d1's point
    // why: change how she runs ← "runs weird" + "tell her the truth" read as Rachel's goal; move out ← "I live
    //   with her" read as the problem itself
    { id: 'g1', skill: 'gist', level: 'B1', point: 'problem', reveals: ['getout', 'live'], seg: [44, 59.8],
      stem: 'What is Rachel’s problem with Phoebe?',
      choices: ['She wants to stop running with Phoebe', 'She wants Phoebe to run in a less odd way',
                'She has to move out of Phoebe’s place'], a: 0,
      cue: 'she’s going to want to のあとの気持ち。', line: 'I just don’t know how to *get out of it*.',
      said: 'またフィービーに走ろうと言われるが、どう断ればいいか分からない。',
      mean: '走り方が恥ずかしいので、一緒に走るのをやめたい。',
      trap: 'runs, live with her などの語だけ拾うと別の悩みに見える。悩みは don’t know how のあと。',
      use: 'I don’t know how to say no.（どう断ればいいか分からない）' },

    // R fix: blind pass 60 % (series knowledge plus a weak "race"); race → a running club, closer to the talk
    // why: work ← a common reason two people meet daily; running club ← "run again" read as a standing date
    { id: 'd1', skill: 'detail', level: 'B1', point: 'live', seg: [46.5, 52.7],
      stem: 'Why is it hard for Rachel to avoid Phoebe?',
      choices: ['They share an apartment', 'They work at the same place', 'They are in the same running club'], a: 0,
      cue: 'get out of it のあと、付け足しの一文。', line: 'I mean, *I live with her*.',
      said: '「だって一緒に住んでるんだもん」と付け足す。',
      mean: '毎日顔を合わせるので、ただ避けるわけにはいかない。',
      trap: 'live を「生きる」と取ると意味が通らない。live with ＋人 は「一緒に住む」。',
      use: 'I live with two roommates.（ルームメイト2人と住んでいる）' },

    // why: tired ← "get out" read as stopping mid-run; apartment ← "out" + "I live with her"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'getout', seg: [47, 52.7],
      stem: 'What does Rachel mean by “get out of it”?',
      choices: ['Find a way to avoid doing it', 'Leave the apartment for good', 'Stop feeling so tired after it'],
      a: 0,
      cue: 'I know she’s going to want to のあと。', line: 'I just don’t know how to *get out of it*.',
      said: '「どうやって抜け出せばいいか分からない」。',
      mean: 'get out of ＋ 予定・約束 ＝ うまく逃れる、やらずに済ませる。',
      trap: 'out を「外に出る」と取ると、家を出る話に見える。of のあとが予定なら「逃れる」。',
      use: 'Can I get out of the meeting?（会議を抜けられる？）' },

    // R fix: blind pass 60 % (topic change was a filler); replaced with I mean's softening use
    // why: correction ← I mean's other use; softening ← I mean as a hedge (「というか」)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['live'], seg: [49.4, 52.7],
      stem: 'What does “I mean” do in Rachel’s last sentence here?',
      choices: ['Adds the reason behind what she just said', 'Fixes a word she said by mistake',
                'Softens what she said so it sounds kinder'], a: 0,
      cue: 'I mean の前の文と、あとの文のつながり。', line: '…how to get out of it. *I mean*, I live with her.',
      said: '「抜け出し方が分からない。だって一緒に住んでるし」。',
      mean: 'ここの I mean は「だって」「つまり」。前の話の理由を足している。',
      trap: 'I mean は言い直しにも使うが、ここは前の語を直していない。あとが理由なら「だって」。',
      use: 'I can’t go. I mean, I’m broke.（行けない。だってお金ないし）' },

    // why: asking why ← "Why don't you" read literally (なぜ〜しないの); blaming ← "straight" heard as a moral word
    // R fix: key lengthened (the key was strictly shortest in 45 % of the bank; C7 ≤ 40 %)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'straight', seg: [52.6, 56.1],
      stem: 'What is the line “Why don’t you just be straight with her?” doing?',
      choices: ['Suggesting what Rachel ought to do here', 'Asking why Rachel has not done it',
                'Blaming Rachel for being dishonest'], a: 0,
      cue: 'すぐあとに続く、短い命令の形。', line: '*Why don’t you* just be straight with her? Tell her the truth.',
      said: '「正直に言えばいいじゃない。本当のことを言いなよ」と友だちが言う。',
      mean: 'Why don’t you…? は理由を聞く質問ではなく、提案。',
      trap: '「なぜ〜しないの？」と訳すと責めているように聞こえる。すぐあとの命令形が提案の合図。',
      use: 'Why don’t you just ask her?（彼女に聞いてみたら？）' },

    // R fix: blind pass 75 % (the sitcom irony picked the only lie); now two lies, so the listener needs which one
    // why: tells the truth ← what she just agreed to do; busy ← the usual excuse script, but no plans are named
    { id: 'i1', skill: 'infer', level: 'B2', point: 'excuse', seg: [55.9, 66.4],
      stem: 'Right after agreeing to tell the truth, what does Rachel do?',
      choices: ['Fakes an injury to get out of running', 'Tells Phoebe the truth about her running',
                'Makes up a busy day to get out of running'], a: 0,
      cue: 'Phoebe が来た直後の、最初の一文。', line: 'Hey, Pheebs. *Monica tripped me.*',
      said: '「本当のことを言う」と言った直後、「モニカに転ばされた」と言う。',
      mean: '作り話のけが。正直に言う決心が、本人を前にした途端に崩れる。',
      trap: '直前の「言うよ」に引っぱられやすい。決めた事と実際にする事のずれが笑いの元。',
      use: 'I think I twisted my ankle.（足首をひねったみたい）' },

    // why: can't ← "don't think" + can't feel like the same negative; could/should ← one weak syllable
    // R fix: the stem ("I don't think I ___ ever run again") gives away i1's fake injury; added excuse to reveals
    { id: 's1', skill: 'sound', level: 'B2', point: 'can', reveals: ['excuse'], seg: [61.5, 66.4],
      stem: 'Fill the gap: “I don’t think I ___ ever run again.”',
      choices: ['can', 'can’t', 'could', 'should'], a: 0,
      cue: 'I のあと、とても弱く短い一語。', line: 'I don’t think I *can* ever run again.',
      said: '「もう二度と走れないと思う」。can は弱く「クン」。',
      mean: '否定は don’t think の方に付ける。I think I can’t より自然。',
      trap: 'can’t の t は消えやすいが、can’t は母音が強く長い。弱い「クン」なら can。',
      use: 'I don’t think I can make it.（行けそうにない）' },

    // R fix: blind pass 75 % ("doctor" a filler); now a doubt reading and the literal wait-and-see reading
    // why: doubts the injury ← "We'll see" as 「どうだか」; too soon to know ← "We'll see" read literally (様子を見よう)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'wellsee', seg: [71.5, 77],
      stem: 'What is the joke in Monica’s last reply, “We’ll see”?',
      choices: ['She hints she might hurt the other one too', 'She doubts that the ankle is really hurt',
                'She means it is too soon to know how bad it is'], a: 0,
      cue: 'ankles と ankle、単数か複数か。', line: '…hurt your *ankles*. — Ankle. — *We’ll see.*',
      said: 'モニカが「足首を痛めてごめん」と合わせると、レイチェルが「片方」と直す。',
      mean: '「これからどうなるかな」＝もう片方も、という冗談の脅し。',
      trap: 'We’ll see を「様子を見よう」とそのまま取ると気づきにくい。直前の単数への直しと組で聞く。',
      use: 'We’ll see about that.（それはどうかな）' },

    // R fix: blind pass 60 % ("buy" a filler); now a near-verb trap on grab
    // why: hide ← "grab your running shoes" heard as taking them away; wait ← the opening "tie my shoe" scene
    { id: 'd2', skill: 'detail', level: 'B1', point: 'shoes', reveals: ['sneak'], seg: [87, 90.7],
      stem: 'What did Phoebe see Rachel do this morning?',
      choices: ['Grab her running shoes and quietly slip out', 'Hide Phoebe’s running shoes in a closet',
                'Put on her shoes and wait by the door'], a: 0,
      cue: 'I saw you のあとの動き二つ。', line: 'I saw you *grab your running shoes* this morning and sneak out.',
      said: '「今朝ランニングシューズを持って、こっそり出ていくのを見た」。',
      mean: 'grab ＝ さっとつかむ。sneak out ＝ こっそり出る。',
      trap: 'shoes だけ拾うと買い物や靴ひもの場面に見える。動詞（grab, sneak）を拾うこと。',
      use: 'Let me grab my jacket.（上着取ってくるね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'sneak', seg: [87, 90.7],
      stem: 'Type what Phoebe says: “…this morning and ___.” (2 words)', answer: 'sneak out',
      cue: 'this morning and のあと、文の最後。', line: '…this morning and *sneak out*.',
      said: '「今朝、こっそり出ていった」。sneak と out がつながる。',
      mean: 'sneak out ＝ 気づかれないように出ていく。',
      trap: 'sneak の k と out がつながり「スニーカウ」に聞こえる。out の t も弱い。',
      use: 'I sneaked out early.（こっそり早めに抜けた）' },

    // R fix: blind pass 60 % (key the only one tied to the injury); distractor 2 now a test-of-fitness excuse too
    // why: practice ← "checking to see if I could run" heard as training; looking for Phoebe ← "checking" +
    //   "Phoebe" said together
    { id: 'd3', skill: 'detail', level: 'B2', point: 'checking', reveals: ['can'], seg: [92.9, 100.6],
      stem: 'What excuse does Rachel give for running alone?',
      choices: ['She was testing whether she could run', 'She was practicing so she could keep up',
                'She was out looking for Phoebe on the path'], a: 0,
      cue: 'I was を何度か言い直したあと。', line: 'I was actually just *checking to see if I could run*. And I can.',
      said: '「走れるかどうか確かめてただけ。で、走れた」と言い訳する。',
      mean: 'けがは治ったという流れにして、ごまかそうとしている。',
      trap: 'checking を「探す」と取ると人を探す話になる。to see if は「〜かどうか確かめる」。',
      use: 'I’m just checking to see if it works.（動くか確かめてるだけ）' },

    // R fix: blind pass 70 % ("relieved" off-mood); replaced with a keyword trap on "idiot"
    // why: calling Rachel an idiot ← "idiot" is said, but about herself (I am not); polite request ← please = お願いします
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'idiot', reveals: ['checking'], seg: [95.9, 103.9],
      stem: 'When Phoebe says “Please, Rachel…”, how does she feel?',
      choices: ['Hurt, and not fooled by the excuse', 'Angry, calling Rachel an idiot for lying',
                'Polite, asking Rachel for a favor'], a: 0,
      cue: 'Please, Rachel のあとの一文。', line: 'Please, Rachel. *I am not an idiot.*',
      said: '「やめてよ、レイチェル。私ばかじゃないから」。',
      mean: 'この Please は「お願い」ではなく「よしてよ」。見え見えの言い訳への反発。',
      trap: 'please をカタカナの「プリーズ＝お願い」と取りやすい。あとに続く文で気持ちが決まる。',
      use: 'Oh, please. Nobody believes that.（よしてよ。誰も信じないよ）' },

    // R fix: blind pass 65 % ("sarcastic" off-mood); replaced with the smoothing-apology frame (すみません to end it)
    // why: just to end the fight ← the stammer and "okay?" read as a quick すみません; defensive ← "situation"
    //   heard as an excuse word
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'apology', seg: [117, 127.8],
      stem: 'How does Rachel sound once she starts with “Phoebe, look…”?',
      choices: ['Sincere, owning up to what she did wrong', 'Nervous, saying sorry just to end the fight',
                'Defensive, sure she did nothing wrong'], a: 0,
      cue: 'sorry のあと、自分のしたことを表す語。', line: 'I handled the situation *horribly*… I *should not have lied* to you.',
      said: '「ごめん。ひどい対応をした。うそをつくべきじゃなかった」。',
      mean: '自分の非をはっきり認める、まっすぐな謝り方。',
      trap: '口ごもりや okay? を、早く終わらせたい謝罪と取りやすい。horribly など自分を責める語が本気の合図。',
      use: 'I handled that badly. I’m sorry.（対応がまずかった。ごめん）' },

    // R fix: cut "did you" (K3/K4: "what did you done" isn't English, so nobody would pick it)
    // why: could/would ← the same reduced frame, only the first sound differs
    { id: 's2', skill: 'sound', level: 'C1', point: 'shouldhave', seg: [127.6, 132.4],
      stem: 'Fill the gap: “So, what ___ done?”',
      choices: ['should you have', 'could you have', 'would you have'], a: 0,
      cue: 'what のあと、つながって速い三語。', line: 'So, what *should you have* done?',
      said: '「じゃあ、どうすべきだった？」。「シュジュヴ」に縮む。',
      mean: 'フィービーは答えを分かっていて、レイチェル自身に言わせようとしている。',
      trap: 'd と y がつながり「ジュ」になる。最初の音が「シュ」か「ク」か「ウ」かで聞き分ける。',
      use: 'What should I have done?（どうすればよかった？）' },

    // R fix: blind pass 80 %; "agreeing she has said enough" → the あいづち frame (uh-huh as accepting)
    // why: which of two ← "which" read as a choice question; accepting ← "uh-huh" heard as あいづち that closes it
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'whichis', reveals: ['shouldhave'], seg: [130, 135.5],
      stem: 'What is Phoebe doing with “Uh-huh. Which is?”',
      choices: ['Pushing Rachel to actually say the truth', 'Asking which of two things Rachel means',
                'Accepting the apology and moving on'], a: 0,
      cue: '直前のレイチェルの文の最後の語。', line: 'I should have told you the truth. — Uh-huh. *Which is?*',
      said: '「本当のことを言うべきだった」に「うん。で、それは？」と返す。',
      mean: '言葉だけの反省で終わらせず、本当の理由を言わせようとしている。',
      trap: 'which を「どちら」と取ると選ぶ質問に見える。Which is? は「それは何？」と続きを促す形。',
      use: 'And the reason is…?（で、理由は…？）' },

    // R fix: blind pass 80 % (two fillers, and "at all" an absolute in the key); now two reassuring readings
    // why: imagined ← "Why do you care?" read as denying anyone looked; stare at everyone ← a common comfort
    //   line, but she argues from “never see again”, not from “everyone”
    { id: 'i2', skill: 'infer', level: 'B2', point: 'strangers', seg: [151.8, 158.4],
      stem: 'What is Phoebe’s point about the people who were looking?',
      choices: ['Strangers’ opinions should not matter', 'Rachel only imagined they were looking',
                'People stare at everyone, so it’s not personal'], a: 0,
      cue: 'Why do you care? のあとのやりとり。', line: 'But people that you *don’t know and will never see again*.',
      said: '「でも知らない人で、二度と会わない人でしょ」と言う。',
      mean: 'そんな人にどう見られても関係ない、と言いたい。',
      trap: 'people が何度も出るので人付き合いの話に見えやすい。but のあとが言い返しの中身。',
      use: 'Who cares? You’ll never see them again.（気にしない。二度と会わないし）' },

    // why: posture ← up + tight read literally; too proud ← "uptight" heard as stuck-up
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'uptight', seg: [169.8, 178.7],
      stem: 'What does Phoebe mean when she calls Rachel “uptight”?',
      choices: ['Too tense and worried about others', 'Standing up very straight and stiff',
                'Too proud to talk to other people'], a: 0,
      cue: 'embarrassing to you のあとの一言。', line: 'Yeah. Okay. *You’re uptight.*',
      said: '「恥ずかしいのは分かる。あなた、お堅いのよ」と言う。',
      mean: 'uptight ＝ 気にしすぎて緊張している、堅苦しい。',
      trap: 'up と tight で「背筋が伸びた」と文字通りに取りやすい。人の性格を表す語として覚える。',
      use: 'Relax, don’t be so uptight.（そんなに堅くならないで）' },

    // R fix: blind pass 80 % (two fillers); now a just-joking reading and a keyword trap on "man"
    // why: only joking ← "man" heard as playful; insult ← "man" taken as calling Phoebe a man
    { id: 'h2', skill: 'humor', level: 'C1', point: 'notuptight', reveals: ['uptight'], seg: [177.6, 188.3],
      stem: 'Why is Rachel’s reply “I am not…, man” funny?',
      choices: ['Her tense denial proves Phoebe’s point', 'She is only joking and is not upset',
                'She insults Phoebe by calling her “man”'], a: 0,
      cue: '言い返す声の大きさと、最後の一語。', line: 'I am *not uptight*, *man*.',
      said: '「堅くなんかない！」とむきになって言い返し、man を付け足す。',
      mean: 'むきになる様子こそ堅さの証拠。man で気楽さを装っても逆効果。',
      trap: 'man を冗談や悪口と取るとずれる。むきになった声と、似合わない気楽な man の組み合わせが笑い。',
      use: 'Chill out, man.（落ち着けって）' },

    // R fix: blind pass 50 % (speed a stock filler) → a keyword trap on "legs"; level B2 → B1 (said plainly after
    //   "because"), which also keeps B1 at 24 % after n1's drop
    // why: coach ← "when I was a kid" heard as training; legs ← "legs were gonna fall off" said soon after
    { id: 'd4', skill: 'detail', level: 'B1', point: 'kid', seg: [193.2, 197.6],
      stem: 'Why does Phoebe run the way she does?',
      choices: ['It is the only way running feels fun to her', 'A coach taught her that way as a kid',
                'It keeps her legs from getting tired'], a: 0,
      cue: 'because のあと。', line: 'I run like I did when I was a kid, because *that’s the only way it’s fun*.',
      said: '「子どもの頃みたいに走るの。それしか楽しい走り方がないから」。',
      mean: '理由は楽しさ。速さや見た目は気にしていない。',
      trap: 'kid だけ拾うと子どもの頃に習った話に見える。理由は because のあとに来る。',
      use: 'That’s the only way it’s fun.（それが一番楽しいやり方）' },

    // why: naughty child ← running from Satan read as guilt; chasing evil ← Satan taken literally
    { id: 'h3', skill: 'humor', level: 'C1', point: 'satan', seg: [202, 214],
      stem: 'What is the joke in “running away from Satan”?',
      choices: ['Satan turns out to be just a neighbor’s dog', 'Phoebe says she was a naughty, wild child',
                'Phoebe thinks running can chase evil away'], a: 0,
      cue: '少し間をおいてからの、付け足しの説明。', line: 'running away from *Satan*… the *neighbor’s dog*.',
      said: '「悪魔から逃げるときみたいに」と言い、あとで「近所の犬」と説明する。',
      mean: '大げさな呼び名だけ先に言い、正体は犬。子どもにとっての怖さが伝わる。',
      trap: 'Satan を本当の悪魔と取ると話が重くなる。間のあとの説明で正体が分かることが多い。',
      use: 'You know, the guy next door.（ほら、隣の人）' },

    // R fix: blind pass 75 %; "only when no one is watching" → the humoring-a-friend script
    // why: embarrassed ← "people are staring" said near the end; to please Phoebe ← "You're right" read as giving in
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [231.9, 250.5],
      stem: 'How does Rachel feel about running by the end?',
      choices: ['She loves running Phoebe’s way after all', 'She joins in only to make Phoebe happy',
                'She still feels too embarrassed to go on'], a: 0,
      cue: 'you’re right のあとの感想。', line: 'You’re right, this *feels great*!… I feel so *free*',
      said: '「本当だ、気持ちいい！すごく自由な感じ」と言う。',
      mean: 'フィービーの走り方を試して、楽しさが分かった。最初の悩みの答え。',
      trap: 'staring が聞こえるので「まだ人目が気になる」に引かれやすい。感想を言う声に注目。',
      use: 'This feels great!（これ、気持ちいい！）' },
  ]
};
