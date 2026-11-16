// “How to Pitch to Women - The Office US” (the official The Office channel, BEST OF SEASON 9): the office coaches
// Dwight through role-plays on selling to a woman client; he stands, looms, can't show he's listening, and is given up on.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 203 s; whisper's lines after 205 s are a
// loop. Untested: 47.7–58 s (Dwight's pitch in suggestive terms), 145.8–150.3 s (a crude line about his face),
// 170–186 s (the kids role-play: whisper "Laura, those your kids" vs the captions "oh are those your kids", and an
// anatomical punchline), 198–203 s (a Pulp Fiction reference: world knowledge, and "Kemp"/"kim" disagree). Speakers
// other than Dwight and Nellie aren't named in the audio, so stems don't name them.
// REVIEW 2026-11-16: pass 5, fix 18, drop 1, new 0; ear checks 2
//   Open: a1 no longer says "she": the to-camera speaker's gender isn't settled by the words.
// EAR CHECK: 27.9 s h1 nt1 — “He's absolutely right. I'm really struggling here.” taken as sincere, not sarcastic
//   (the words back it: she has just called herself “Mr.”; check there's no mocking laugh in her voice)
// EAR CHECK: 135 s nt3 — the stress in “I am a person” falls on “am” (insisting), not “I” or “person” (ship only once
//   confirmed)
import type { Clip } from '../types.ts';

export const pitchWomen: Clip = {
  id: 'pitchwomen', video: 'aewQRIyY_CE', title: 'How to Pitch to Women', dur: 226, wpm: 189, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 blind 70 % (only the key was a failure; "never" stood out). All three are now ways it could end.
    // why: time ← "The meeting's in less than an hour" is said near the end; coach ← "Watch what I do and try to learn"
    //   sounds like the fix that finally works
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['hopeless'], seg: [0, 190.7],
      stem: 'How does the training go for Dwight, overall?',
      choices: ['They decide he can’t be taught', 'They run out of time before the meeting', 'He gets it once a coach shows him'], a: 0,
      cue: '最後の役割練習のあとの、短い感想。',
      said: '立ったままの売り込みも、聞く練習も途中で止められ、最後は見込みなしと言われる。',
      mean: '何度やり直しても上達しない流れ。研修の失敗が場面の筋。',
      trap: '「1時間もない」や「見て学べ」が耳に残るが、最後の手本のあとも見込みなしで終わる。',
      use: 'I just can’t get the hang of it.（どうしてもコツがつかめない）' },

    // R fix: V2 blind 60 % (stem "must do" + training made "change habits" the only fit). Stem now asks what the line
    //   says about him; all choices are about his experience.
    // why: experience ← "old dog" heard as ベテラン, with "You got this, Schrute" right after; teaching ← "tricks" read as
    //   his own skills to pass on
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'olddog', seg: [4.0, 8.9],
      stem: 'What does the line just before the role-play say about Dwight?',
      choices: ['His old ways of selling need to change', 'His experience will carry him through', 'His tricks are worth teaching the others'], a: 0,
      cue: '始まる直前、「tricks」を含む一言。',
      line: 'Time to *learn a few new tricks, old dog*. You got this, Schrute.',
      said: '始める前に「老犬も新しい芸を覚える時だ。いけるぞ」と声がかかる。',
      mean: '「老犬に芸は仕込めない」の裏返し。長年のやり方を変える時だ、ということ。',
      trap: 'old dog を「ベテラン」と取ると逆。learn new tricks は「変われ」の合図。',
      use: 'Time to learn some new tricks.（新しいやり方を覚える時だ）' },

    // R drop: i3 — V2 the title ("How to Pitch to Women") answers it blind (80 %), and d1 tests the same point.
    // R fix: V2 blind 75 % (the key was the only one about the boss being a man). New distractor on her "Mr." as a slip.
    // why: flustered ← "I am?" just before shows surprise, so "Mr." could be a slip; mocking ← her agreement could read
    //   as sarcasm aimed at Dwight
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mister', reveals: ['boss'], seg: [20.6, 31.2],
      stem: 'Why is the woman’s first line as the boss funny?',
      choices: ['Even she can only picture a boss as a man', 'She is too flustered to get her own name right',
                'She is making fun of Dwight’s question'], a: 0,
      cue: '名乗るときの、名前の前の短い一語。',
      line: 'Hi, I’m *Mr.* Hannon. How can I help you? … I’m *really struggling* here.',
      said: '上司役で Mr. Hannon と男性の敬称で名乗り、「すごく難しい」と言う。',
      mean: '女性の上司役なのに、本人も上司を男性でしか想像できない。偏見は彼女にもある。',
      trap: '直前の I am? で言い損ねに聞こえるが、そのあと自分で「難しい」と認めている。',
      use: 'Hi, I’m Ms. Tanaka. How can I help?（田中です。ご用件は？）' },

    // R fix: K6 blind 50 % (the key was the only two-sided choice). All three now name a target the same way.
    // why: only her ← "I'm really struggling" heard as her failing at acting (right target, too narrow); only Dwight ←
    //   her agreement read as irony that plays along to show him up
    // anchor: 21.1 s she chooses “Mr. Hannon” herself; 27.9 s “He's absolutely right. I'm really struggling here.” agrees
    //   with the remark that nobody would believe she's a boss
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'mister', reveals: ['boss'], seg: [20.6, 31.2],
      stem: 'In this first role-play, who is the joke on?',
      choices: ['Both of them: she shares the bias he voices', 'Only her: she can’t even act like a boss',
                'Only Dwight: she plays along to mock him'], a: 0,
      cue: '名乗り方と、そのあとの彼女の同意。',
      line: 'Hi, I’m *Mr.* Hannon. … He’s *absolutely right*. I’m really struggling here.',
      said: '上司役で Mr. と名乗り、「誰も信じない」に「その通り。難しい」と認める。',
      mean: '偏見を言うのは Dwight だが、彼女も同じ前提にいる。笑われているのは二人とも。',
      trap: '「難しい」だけなら演技の話、「その通り」を皮肉と取れば Dwight だけが的。Mr. と名乗った直後なので本気。',
      use: 'Honestly, I’d have guessed the same.（正直、私も同じこと思ってた）' },

    // why: used to ← "boss" heard and the reason pinned on him, not her; buyer ← "I'll be the buyer" comes right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'boss', seg: [22.8, 31.2],
      stem: 'Why is the first role-play said not to be working?',
      choices: ['No one would believe she’s a boss', 'He isn’t used to selling to bosses', 'She doesn’t sound like a real buyer'], a: 0,
      cue: '「working for me」のあとの理由。',
      line: 'this isn’t working for me, ’cause *no one would ever believe* that *she would be a boss*.',
      said: '「うまくいかない。彼女が上司だなんて誰も信じないから」と言う。',
      mean: '演じる人のせいにしているが、女性が上司という発想がないだけ。',
      trap: 'すぐあと買い手役が替わるので「買い手らしくない」に引かれる。理由は cause のあと。',
      use: 'This isn’t working for me.（これ、しっくりこないな）' },

    // R fix: V2 blind 70 % ("respect" was a filler beside a forceful key). Swapped in the katakana アグレッシブ trap.
    // why: keen ← katakana アグレッシブ = 積極的, a plus in Japanese; short ← "12 minutes" comes right after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sit', seg: [34.1, 41.95],
      stem: 'Why does Dwight stay standing in the meeting?',
      choices: ['To come across as forceful', 'To come across as keen and lively', 'To keep the meeting short'], a: 0,
      cue: '「sit down」を断ったあとの「I want to…」。',
      line: 'I never sit down during sales meetings. I want to appear *aggressive and imposing*.',
      said: '座るよう勧められても「商談では座らない。威圧的に見せたい」と断る。',
      mean: '相手を落ち着かせるどころか、圧をかけるのが彼のやり方。研修の狙いと正反対。',
      trap: 'カタカナのアグレッシブは「積極的」だが、ここは imposing と並んで「威圧的」。',
      use: 'Please, have a seat.（どうぞ、おかけください）' },

    // why: 10 ← the "-lve" end is short, so twelve sounds like a short round number; 20 ← twelve and twenty share "tw-"
    { id: 'n1', skill: 'number', level: 'B1', point: 'minutes', reveals: ['needs'], seg: [36.9, 47.6], keep: true,
      stem: 'How fast does Dwight say he will make the sale?',
      choices: ['In 10 minutes', 'In 12 minutes', 'In 20 minutes'], a: 1,
      cue: '「sell to you in」のすぐあと。',
      line: 'I am going to sell to you in *12 minutes*.',
      said: '「12分であなたに売ってみせます」と宣言する。',
      mean: '商談の時間を自分で決めてしまう。直後に「彼女はゆっくり話したい」と止められる。',
      trap: 'twelve は短く終わり、twenty は「ニー」と伸びる。ten なら母音が一つだけ。最後の音で聞き分ける。',
      use: 'I’ll be done in twelve minutes.（12分で終わります）' },

    // R fix: V2 blind 60 % (the key was the only patient choice). "A quick deal" → a second "time" reading.
    // why: think it over ← "take her time" heard alone, as time to decide; be told ← Dwight's next line "I will tell
    //   her what her needs are" reuses the same words
    { id: 'd3', skill: 'detail', level: 'B2', point: 'needs', reveals: ['minutes'], seg: [42.0, 50.45],
      stem: 'When the pitch is interrupted, what is the client said to want?',
      choices: ['Time to talk about what she needs', 'Time to think it over before deciding', 'To be told what her needs are'], a: 0,
      cue: '「No, actually」のあと。',
      line: 'No, actually, *she’d like to take her time* discussing her needs.',
      said: '「実は彼女はゆっくり話したいんだ」と止める。',
      mean: 'she’d は she would。急がず相手の話を聞け、という指導。',
      trap: 'take her time だけ拾うと「考える時間」になる。何の時間かは discussing のあと。',
      use: 'Take your time. No rush.（ゆっくりでいいよ。急がないで）' },

    // R fix: V2 blind 60 %. "Hard to follow" → the face-value reading of the questions (interest in him).
    // why: know him ← the questions taken at face value, as interest in him; too long ← "12 minutes" and "once I'm
    //   finished" earlier
    { id: 'i1', skill: 'infer', level: 'B2', point: 'kill', seg: [58.9, 72.4],
      stem: 'What do the written-down questions tell Dwight about his pitch?',
      choices: ['It came across as threatening', 'It made her want to know him', 'It went on much too long'], a: 0,
      cue: '「questions」と言ったあとの三つの文。',
      line: 'have you ever *killed a woman*? … *Please, sir, will you not kill me?*',
      said: '感想を聞かれ、「女性を殺したことは？何人？どうか殺さないで」と質問の形で読み上げる。',
      mean: '質問の形をした感想。売り込みが怖かった、と遠回しに伝えている。',
      trap: 'questions を本当の質問と取ると「興味を持たれた」に引かれる。最後は質問でなくお願い。',
      use: 'Honestly, that came across a bit strong.（正直、ちょっと強すぎたかも）' },

    // R fix: V2 blind 55 %. "Too long" → the coaching-frame misreading (the questions as a model to copy).
    // why: hear more ← the questions taken as real interest in him (the sincerity flip); more questions ← in a training
    //   session, a list of questions heard as a model of what he should ask
    // anchor: 59.4 s “Anyone have any thoughts?” puts these in the feedback slot; 62.2 s “I thought it went great” is
    //   the view they answer; 70.2 s “Please, sir, will you not kill me?” is a plea, not a question to answer
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'kill', seg: [58.9, 72.4],
      stem: 'Which reply from Dwight would show he got the point of the questions?',
      choices: ['So I came on way too strong.', 'So I should ask her more questions.', 'So you want to hear more about me.'], a: 0,
      cue: '感想を求められた場面と、最後の一文の形。',
      line: '*Anyone have any thoughts?* … *Please, sir, will you not kill me?*',
      said: '「感想は？」に、質問として「殺したことは？」「殺さないで」と読む。',
      mean: '感想の時間に出た「質問」は、答えを求めていない。怖かったという評価なので、伝わったなら態度を認める返事が合う。',
      trap: '質問の形には答えを返したくなる。何の時間に出た言葉かを先に考える。形より、相手が伝えたいことに返す。',
      use: 'Point taken. I’ll tone it down.（了解。もう少し控えめにする）' },

    // R fix: V2 blind 60 %. "Speak more softly" → a keyword trap on "a little smile".
    // why: smile ← "a little smile" is said, but as a sign of listening, not of pitching; simpler ← his long talk about
    //   ear hairs sounds like the problem being fixed
    { id: 'g2', skill: 'gist', level: 'B1', point: 'listen', seg: [74.2, 139.1],
      stem: 'In the middle stretch, what are they trying to get Dwight to do?',
      choices: ['Show clients that he’s listening', 'Smile more while he makes his pitch', 'Explain things in simpler words'], a: 0,
      cue: '「crucial」のあとの動詞。何度も出てくる。',
      said: '聞くことが大切だと言い、聞いている様子を見せる練習をさせる。Dwight は理屈で返す。',
      mean: '聞いていても、相手に伝わらなければ意味がない、という研修。',
      trap: 'smile は聞いている合図。耳の毛の長話は Dwight の言い返しで、練習の中身ではない。',
      use: 'I’m listening. Go on.（聞いてるよ。続けて）' },

    // why: had to ← "have to" reduces to "hafta", and the f/t blur toward "hadta"; you'd have to ← the 'd of would is
    //   easy to imagine before "have"
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [85.95, 89.3],
      stem: 'Fill the gap: “Okay, well, ___ show us.”',
      choices: ['you have to', 'you had to', 'you’d have to'], a: 0,
      cue: '「Okay, well」のあと、show の前の短い音。',
      line: 'Okay, well, *you have to* show us.',
      said: '「聞いてる」と答えた Dwight に「じゃあ、見せてくれないと」と返す。',
      mean: 'have to は「ハフタ」に縮む。v が f に変わり、to も弱くなる。',
      trap: 'had to なら過去の話で、「今見せて」と合わない。弱い語は場面の時制で決める。',
      use: 'You have to try this.（これ、食べてみなきゃ）' },

    // R fix: S4 segment was 16 s (now 14.45 s, ending after "don't vibrate at all"); V2 blind 65 % (the key echoed the
    //   stem's "showing"). Stem now quotes the moment; "waste of time" → a refusal to look silly.
    // why: silly ← "That's impossible" heard as a refusal to perform; covering ← "Are you listening now?" just before
    //   suggests he wasn't
    { id: 'i2', skill: 'infer', level: 'C1', point: 'show', seg: [85.95, 100.4],
      stem: 'Why does Dwight say “That’s impossible”?',
      choices: ['He takes “show us” to mean visible proof', 'He won’t do something that makes him look silly',
                'He’s covering up that he wasn’t listening'], a: 0,
      cue: '「impossible」のあと、耳と脳についての説明。',
      line: 'That’s impossible. *Listening happens in the ear and in the brain.* … our external hairs *don’t vibrate*',
      said: '「無理だ。聞くのは耳と脳。毛が震える生き物もいるが、人間のは震えない」と言う。',
      mean: 'show us を「目に見える証拠を」と文字どおりに取り、理屈で返している。',
      trap: '「無理」を断りと取りやすいが、本人は大まじめ。言い訳か本気かは、理由の中身で判断。',
      use: 'Nod if you can hear me.（聞こえたらうなずいて）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'nod', seg: [103.0, 107.3],
      stem: 'Type the words: “___ shows that I hear you.” (6 words)', answer: 'a little smile and a nod',
      cue: '「What are you doing?」への答えの最初。',
      line: '*A little smile and a nod* shows that I hear you.',
      said: '「ちょっと笑ってうなずくと、聞いてるって伝わる」と手本を見せる。',
      mean: 'little の t は弾んで「リロ」に近く、and a は「アンナ」とつながる。',
      trap: 'a が二つとも弱く、落としやすい。6語になるか、最後に数えて確かめる。',
      use: 'Just smile and nod.（とりあえず笑ってうなずいて）' },

    // why: Pam ← her name comes up inside the story (she's painting the murals); Dwight ← his name is said twice in
    //   the same request, as the listener
    { id: 'w1', skill: 'who', level: 'B1', point: 'teller', seg: [108.2, 119.75],
      stem: 'Who is asked to tell the story of what happened earlier today?',
      choices: ['Nellie', 'Pam', 'Dwight'], a: 0,
      cue: '頼みごとの最初に呼ばれる名前。',
      line: '*Nellie*, why don’t you tell Dwight what we were doing earlier today',
      said: 'Nellie に「今日のことを Dwight に話して」と頼み、Dwight には聞く役をさせる。',
      mean: 'why don’t you ～? は「～してみて」という軽い依頼。',
      trap: 'Pam は話の中で壁画を描く人として出るだけ。頼む相手は文頭の名前。',
      use: 'Why don’t you go first?（先にどうぞ）' },

    // R fix: V2 blind 55 % ("poking fun at Pam" was a filler). New distractor from hearing only the first theme.
    // why: nothing to do with paper ← only "children of the world coming together" caught; company ← "child-labory"
    //   heard as an accusation, not a denial
    { id: 'h3', skill: 'humor', level: 'C1', point: 'murals', reveals: ['teller'], seg: [119.2, 131.3],
      stem: 'What makes the end of Nellie’s list of mural themes funny?',
      choices: ['Her own themes sound like child labor', 'Her themes have nothing to do with paper',
                'She thinks the paper company uses child workers'], a: 0,
      cue: '最後の「but not」に続く部分。',
      line: '*Children of the world* coming together, *cutting down trees* to make paper, *but not in a child-labory way*.',
      said: '「世界の子どもが手を取り合い、木を切って紙を作る。児童労働っぽくなく」と言う。',
      mean: '子どもと木を切る作業を並べたら児童労働に聞こえてしまい、あわてて打ち消している。',
      trap: 'but not は告発でなく打ち消し。自分の言葉の印象を自分で直している。',
      use: 'I mean that in a good way.（いい意味で言ってるんだよ）' },

    // R fix: V2 blind 70 % ("jokes to relax everyone" was a filler). New distractor: the tip heard as praise. The
    //   speaker ear check is gone: the key doesn't turn on who replies.
    // why: praise ← "like a person" heard as "you nod like a real person"; wording ← "person" picked up and repeated,
    //   like a correction
    { id: 'h2', skill: 'humor', level: 'C1', point: 'person', seg: [131.0, 139.1],
      stem: 'Why is the reply to “like a person” funny?',
      choices: ['He hears the tip as hinting he isn’t human', 'He takes the tip as praise for his nod',
                'He corrects the wording of the advice'], a: 0,
      cue: '「like a person」の直後の短い返事と、その次。',
      line: 'Just a regular nod, *like a person*. — *I am a person.* — Of course.',
      said: '「人間みたいにうなずいて」に「僕は人間だ」と返し、なだめられる。',
      mean: 'like a person は「普通の人みたいに」程度。それを「人間じゃない」と言われたと受け取った。',
      trap: 'ほめ言葉なら、相手は慌ててなだめない。反応で本気度を読む。',
      use: 'Just act natural.（自然にしてて）' },

    // R fix: V2 blind 55 % (the "person" choice was a weak filler). It now states the default end-stress rule, which
    //   fails here because "person" was just said.
    // why: "I" ← the contrastive-stress pattern (one person against another) fits many short replies, but no one else
    //   is in the comparison; person ← the last content word usually carries the stress, but it's old news here
    // anchor: 134.6 s “like a person” just before; “I am” left uncontracted in both sources; 136.2 s “Of course.
    //   You're a person” answers an insistence, not a contrast
    // retired: a C2 stress item, until its ear check (135 s)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'person', seg: [131.0, 139.1], retired: true,
      stem: 'Where is the stress in “I am a person,” and why?',
      choices: ['On “am”: insisting, against a hint that he isn’t', 'On “I”: setting himself against someone who isn’t',
                'On “person”: the new word, as in most sentences'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'Just a regular nod, like a person. — I *am* a person.',
      said: '「人間みたいにうなずいて」に、I’m と縮めず「僕は人間だ」と返す。',
      mean: 'am を縮めずに強めると「そう言うけど、実際そうだ」という打ち消しになる。日本語の「ちゃんと人間だよ」に近い。',
      trap: '文末の語に強勢の型で person を選びやすいが、直前に出た語は強めない。',
      use: 'I do listen to you!（ちゃんと聞いてるってば！）' },

    // R fix: S3 cue leaked "face"; S1 "breaks off" hinted "keep going"; V2 blind 50 % (only the key had a clip word).
    // why: look ← "Look at it" comes right after; on her own ← carry = 運ぶ・背負う, as in carrying the whole thing
    //   alone
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'carryon', reveals: ['teller'], seg: [140.8, 145.6],
      stem: 'As Nellie tells her story, what does she say she can’t do?',
      choices: ['Keep going while he makes that face', 'Look at him while he makes that face', 'Carry the role-play on her own'], a: 0,
      cue: '「I can’t」をくり返したあとの一文。',
      line: 'I just *can’t carry on* with that face.',
      said: '話の途中で「もう無理。あの顔のままじゃ続けられない」と止まる。',
      mean: 'carry on は「続ける」。顔が気になって、話を続けられないということ。',
      trap: 'carry を「運ぶ・背負う」と取ると「一人で抱える」に聞こえる。on が付くと「続ける」。',
      use: 'Sorry, please carry on.（失礼、どうぞ続けて）' },

    // R fix: S3 cue leaked "sorry"; K6 the key was the only one with "sorry" and two parts; N1 the line's "Yeah" is
    //   the captions' only (whisper: "No"), so it's cut.
    // why: takes back ← "I'm sorry" heard as an apology (the Japanese すみません frame); rude ← the sorry heard as aimed
    //   at Dwight, whose face it was about
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'extreme', seg: [150.25, 155.4],
      stem: 'After someone calls the description “a bit extreme,” what does the reply do?',
      choices: ['Stands by it, softened with a “sorry”', 'Takes it back, with a “sorry” first',
                'Apologizes for being rude to Dwight'], a: 0,
      cue: '謝る言葉のあと、but に続く部分。',
      line: 'It’s a bit extreme. — … *I’m sorry, but that is true*.',
      said: '「言いすぎ」と言われ、「ごめん、でも本当だから」と返す。',
      mean: 'I’m sorry, but… は謝罪でなく前置き。言ったことは引っ込めず、but のあとで押し通す。',
      trap: 'sorry を「すみません」と取ると引いたように聞こえる。本音は but のあと。',
      use: 'I’m sorry, but I disagree.（悪いけど、賛成できない）' },

    // R fix: V2 blind 50 % ("spiteful" was a filler). Swapped in "fed up", the near miss "God, Dwight" invites.
    // why: fed up ← "God, Dwight" and "garbage" sound like giving up; playful ← "garbage" is too harsh to be meant, so
    //   it sounds like teasing
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'instinct', seg: [155.3, 166.0],
      stem: 'How is the advice about Dwight’s instincts meant?',
      choices: ['Blunt: a real effort to help him', 'Fed up: done with trying to help', 'Playful: teasing, not meant at all'], a: 0,
      cue: '「garbage」のあと、次に何をさせるか。',
      line: 'Just *ignore every instinct you have*. It’s all garbage, okay? … *Watch what I do and try to learn.*',
      said: '「勘は全部無視しろ。全部ゴミだ。やることを見て学べ」と言う。',
      mean: '言葉はきついが、時間がない中で手本を見せようとしている。急ぎの指導。',
      trap: 'God, Dwight や garbage で「諦めた」に聞こえるが、続く「見て学べ」でまだ助ける気だと分かる。',
      use: 'Trust me on this one.（ここは任せて）' },

    // R fix: V2 blind 60 % ("a better reason" was a filler). New distractor: lost + cause read as 目的を見失う.
    // why: lost the client ← "lost" heard as a lost sale; lost sight ← cause read as 理由・目的, word by word
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'hopeless', seg: [186.7, 190.7],
      stem: 'After the kids role-play, what does the speaker conclude?',
      choices: ['Training him isn’t worth more effort', 'He has already lost them the client', 'He’s lost sight of what it’s for'], a: 0,
      cue: '「Okay, um」のあと、すぐ続く言い換え。',
      line: 'this is *a lost cause*. He’s hopeless.',
      said: '「これはもう見込みがない。彼は手遅れだ」と言う。',
      mean: 'a lost cause は、努力しても報われないこと。hopeless がその言い換え。',
      trap: 'cause を「理由」、lost を「失った」と別々に取ると意味がずれる。組み合わせで覚える。',
      use: 'Fixing this old printer is a lost cause.（この古いプリンターの修理はもう無理）' },

    // R fix: the stem said "her", but the words don't settle the speaker; "now" hinted at a change; V2 blind 55 %.
    //   "Never married" → a keyword trap on kids.
    // why: still doesn't care ← "I didn't care" heard without "ten years ago" and "but"; kids ← kids, married and
    //   bachelor come close together, but the kids are the speaker's
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'soft', seg: [190.5, 198.3],
      stem: 'In the comment to the camera, how does the speaker feel about Dwight?',
      choices: ['Has come to care how his life goes', 'Still doesn’t care what becomes of him',
                'Feels sorry that he never had kids'], a: 0,
      cue: '「Ten years ago」の文と、but のあと。',
      line: 'Ten years ago, I *didn’t care* if Dwight got married… *But having kids makes you so soft*.',
      said: '「10年前は彼がどうなろうと平気だった。でも子どもで甘くなる」と話す。',
      mean: '昔は無関心だったが、今は彼の人生が気になる。soft＝情にもろい。',
      trap: 'didn’t care だけ拾うと「今も無関心」に聞こえる。過去形と but で今との対比を聞く。',
      use: 'I’ve gone soft in my old age.（年をとって丸くなった）' },
  ]
};
