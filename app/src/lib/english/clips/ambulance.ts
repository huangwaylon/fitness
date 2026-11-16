// “Andy Runs Into an Ambulance | Parks and Recreation” (the official Parks and Recreation channel, Season 5): after a
// day of doctors, Andy is handed a $500 bill, insists his “free medicine card” and “the insurance thing” cover it, runs
// out, hits an ambulance, and decides doctors are scam artists: he and April will just care for each other.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 94 s; music after.
// Speakers: the long list (“my ankles”, “April had her sinuses removed”) and the lip are Andy's; the bill is the woman
// at the desk. Only April is named in the audio, so no item asks who says what.
// Untested on purpose: the doctor line at 17–22 s (sexual); “We won't be needing that” (whisper) vs “well we need that”
// (captions) at 31.8 s; the shout at ≈ 49 s (whisper “Let's go! Dyna Dash”, captions “dinos”); the ambulance at
// 55–60 s (visual, and whisper “I called an ambulance” vs captions “oh my god ambulance”); the last line at 93.3 s
// (whisper “I don't know. Who cares?”, captions “oh no who could”).
// EAR CHECK: 48.7 s r1 — the cut falls after “you know what?” and before the shout (captions put it at 49.1 s, whisper
//   has “you know what?” running to 48.7 s)
// EAR CHECK: 81.7 s a1 c2 — “Mm-hmm, so romantic” is sincere, not sarcastic (captions “mm-hmm so romantic”, whisper
//   “Mmm, it's so romantic”)
// REVIEW 2026-11-16: pass 8, fix 15, drop 0, new 0; ear checks 2
// OPEN: c1 (C2) is still about 50 % blind. i4's new distractor ("mocking the desk's rules") is refuted only if "What is
//   insurance?" is heard as a real question: confirm on the phone with the a1/c2 ear check.
// OPEN: the short corrections ("X-rayed", "Cholesterol tests", "Looked at") are probably April's, not Andy's (the
//   speakers note above says Andy). No item depends on it; i1's stem says only that Andy lists.
import type { Clip } from '../types.ts';

export const ambulance: Clip = {
  id: 'ambulance', video: 'CE95PhvQbvg', title: 'Andy Runs Into an Ambulance', dur: 115, wpm: 140, band: 'slow',
  tags: ['恋愛', '買い物'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): the key was the only allergy choice. The needle-marks filler is now an allergy to medicine.
    // why: blood tests ← "blood… cholesterol tests" come a few seconds later; medicine ← "allergic" heard, and the next
    //   line is about needles, so drugs come to mind
    { id: 'd1', skill: 'detail', level: 'B1', point: 'food', seg: [0, 3.6],
      stem: 'At the start, what will they find out in a few days?',
      choices: ['Whether he is allergic to any food', 'Whether his blood test results are fine',
                'Whether he is allergic to any medicine'], a: 0,
      cue: '最初の一文、if のあと。',
      line: 'if you’re *allergic to any food*, we’ll know in a few days.',
      said: '「食べ物のアレルギーがあれば、数日で分かります」と言われる。',
      mean: 'アレルギー検査の結果待ち。何に反応するかは、数日後に出る。',
      trap: 'すぐあとに needles や blood が出てくるので引かれやすい。if のあとが、調べている中身。',
      use: 'We’ll know in a few days.（数日で分かるよ）' },

    // R fix: V2 (blind 60 %): "stabbed him on purpose" was a filler. Now a rough-nurse reading of "stabbed", and the key
    //   is worded like the others.
    // why: rough nurse ← "stabbed" sounds violent, as if the shot was done badly; real allergy ← "allergic" taken at
    //   face value, the literal reading
    { id: 'h1', skill: 'humor', level: 'C1', point: 'needles', seg: [2.5, 7.1],
      stem: 'Why is Andy’s guess “based on the redness” funny?',
      choices: ['He calls the normal mark a needle leaves an allergy', 'He blames the redness on a rough, careless nurse',
                'He has found a real allergy to the needles'], a: 0,
      cue: '「allergic to」のあと、何に対して？',
      line: 'based on the redness, I might be *allergic to getting stabbed by needles*.',
      said: '「赤くなってるから、針で刺されることにアレルギーかも」と言う。',
      mean: '針を刺せば誰でも赤くなる。当たり前の反応を「アレルギー」と呼ぶのが笑い。',
      trap: 'stabbed は乱暴に聞こえるが、ただの注射。allergic を文字どおり取らず、何に対してかを聞く。',
      use: 'I think I’m allergic to Mondays.（月曜アレルギーかも）' },

    // R fix: V2 (blind 60 %): the doctor's-name filler made the key the only sensible choice. Now a "medical word he
    //   didn't follow" reading, which X-rayed and cholesterol invite.
    // why: stranger thing ← the short words ("X-rayed", "Cholesterol tests") heard as new items on a growing list;
    //   doctor's word ← both short words are medical terms, so they sound like what the doctors told him
    { id: 'i1', skill: 'infer', level: 'C1', point: 'fixes', reveals: ['science'], seg: [9, 14.3],
      stem: 'As Andy lists what the doctors did, what follows each odd claim?',
      choices: ['A plainer word for what really happened', 'A second, even stranger thing they did',
                'A doctor’s word he says he didn’t follow'], a: 0,
      cue: '「microwaved」と「science」の直後の短い語。',
      line: 'my ankles *microwaved*. — *X-rayed*. … my blood away to use *for science*. — *Cholesterol tests*.',
      said: '「足首を電子レンジに」→「レントゲン」、「血を科学に」→「コレステロール検査」。',
      mean: '大げさな言い方のすぐあとに、実際の中身が来る。ありふれた検査を大事件のように話す。',
      trap: '短い語を新しい項目と取ると、治療が増えて聞こえる。直前の言い直しかを聞く。',
      use: 'Technically, it was just a checkup.（正確には、ただの健診）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'science', seg: [11.2, 14.3],
      stem: 'Type what he says: “They took my blood ___ for science.” (3 words)', answer: 'away to use',
      cue: '「blood」のすぐあと。短い語がつながる。',
      line: 'They took my blood *away to use* for science.',
      said: '「血を持っていって、科学に使ったんだ」と言う。',
      mean: 'away to use が「アウェイタユーズ」とつながる。to は弱く、「タ」に近い音になる。',
      trap: 'to が消えると away use のように聞こえる。動詞の前には to がある、と補って聞く。',
      use: 'They took it away to fix it.（直すために持っていった）' },

    // why: doctor said free ← "free" is heard, but it belongs to the card; already paid ← "Oh, yeah" heard as "that's
    //   done already"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'card', seg: [29.3, 34.2],
      stem: 'When the bill comes, why does Andy think they won’t pay?',
      choices: ['He has a card for free medicine', 'The doctor said the visit was free', 'He already paid when they arrived'],
      a: 0,
      cue: '「Here’s your bill」への返事の後半。',
      line: 'I’ve got the *free medicine card*.',
      said: '請求書を出されて、「無料で薬がもらえるカードがある」と答える。',
      mean: 'カードがあるから払わなくていい、と思いこんでいる。',
      trap: 'free だけ拾うと「医者が無料と言った」と取りやすい。free がどの名詞についているかを聞く。',
      use: 'I’ve got a coupon for that.（それ、クーポンあるよ）' },

    // why: card covers it ← "free medicine card" and "we're covered" are both heard; pay later ← the usual "can I pay
    //   in parts" script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'bill', reveals: ['youknow', 'card'], seg: [29.3, 52],
      stem: 'How does the business with the bill end?',
      choices: ['They leave with the bill unpaid', 'They leave once the card covers it',
                'They leave after agreeing to pay later'], a: 0,
      cue: '2回目の「500」のあと、何が起きる？',
      said: '無料カードも保険も通じず、最後は「どいて！」と叫んで出ていく。',
      mean: '払わないまま飛び出す。カードの話は、受付には最後まで通じなかった。',
      trap: 'free や covered が何度も聞こえるので、払わずに済んだと思いやすい。相手の答えはずっと500。',
      use: 'Can I pay for this later?（あとで払ってもいいですか）' },

    // why: $50 ← "five" caught and "hundred" lost before "deductible"; $5,000 ← a big medical bill expected, the
    //   hundred/thousand swap
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [34, 37.2], keep: true,
      stem: 'What amount does the woman at the desk give?',
      choices: ['$50', '$500', '$5,000'], a: 1,
      cue: '数字は「deductible」の直前。',
      line: 'there’s a *500* deductible for dental procedures.',
      said: '「歯の治療は500ドルの自己負担」と言い、あとでもう一度「500」。',
      mean: 'five hundred ＝ 500。保険があっても自分で払う額。',
      trap: 'hundred は弱く短くなりやすい。thousand なら「サウ」の音がある。',
      use: 'That’ll be fifty dollars, please.（50ドルになります）' },

    // R fix: V2 (blind 85 %): only the key was a real definition. All three are now "the part…" readings, with the
    //   reversed direction (insurance pays) as the strong distractor.
    // why: insurance pays ← "deductible" next to insurance talk, the direction reversed; discount ← deduct = 差し引く,
    //   read literally as money taken off
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'deduct', reveals: ['amount'], seg: [34, 43.6],
      stem: 'What does the woman mean by a “deductible” here?',
      choices: ['The part you pay before insurance pays', 'The part your insurance pays, not you',
                'The part taken off the bill as a discount'], a: 0,
      cue: '保険の話のあと、もう一度出る数字。',
      line: 'there’s a 500 *deductible*… — It’s *still* 500.',
      said: '歯の治療は500の deductible、保険があっても「それでも500」。',
      mean: 'deductible ＝ 保険が払う前に自分で払う分（自己負担額）。',
      trap: 'deduct は「差し引く」なので割引と取りやすい。still 500 なら自分の負担。',
      use: 'What’s the deductible on this plan?（このプランの自己負担額は？）' },

    // R fix: V2 (blind 60 %): the key was the only "polite" choice. A polite request reading now sits beside it.
    // why: check again ← "I think… you're wrong" heard as a polite request to look again; ready to pay ← the Japanese
    //   frame: 〜と思います read as doubt, so he must be backing down
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'hedge', reveals: ['covered'], seg: [36.9, 42.2],
      stem: 'When Andy tells her she has it wrong, what do his opening words do?',
      choices: ['Soften what is really a flat no', 'Ask her politely to check again',
                'Show he is ready to give in and pay'], a: 0,
      cue: '「you’re wrong」の前と、「covered」の前。',
      line: 'Oh, *I think*, uh, you’re wrong… *I believe* we’re covered.',
      said: '「えっと、違うと思いますよ。保険でカバーされてるはず」と言う。',
      mean: 'I think と I believe は反論をやわらげる前置き。中身は「払わない」のまま。',
      trap: '日本語の「〜と思います」のように自信のなさと取りやすいが、引かずに言い返している。',
      use: 'I think there’s been a mistake.（何か手違いがあると思うんですが）' },

    // why: plan for teeth ← "dental" was the topic just before; waste of money ← "thing" heard as looking down on it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'thing', reveals: ['amount'], seg: [38.4, 43.6],
      stem: 'What does his name for their coverage suggest?',
      choices: ['He doesn’t really know what it covers', 'He has a special plan just for teeth',
                'He thinks insurance is a waste of money'], a: 0,
      cue: '「insurance」のあとの、あいまいな一語。',
      line: 'We have *the insurance thing*. … — It’s still 500.',
      said: '「保険のやつがあるから」と言い、すぐに「それでも500です」と返される。',
      mean: '〜 thing ＝「〜ってやつ」。中身を説明できないとき、ぼかして言う形。',
      trap: 'thing を見下した言い方と取りやすい。自分の保険なのに名前で言えない、という点に注目。',
      use: 'I did the whole online check-in thing.（オンラインのやつ、やったよ）' },

    // R fix: V2 (blind 50 %): with three choices the plain present stood out. Added "we'd be", a conditional that fits
    //   the gap and the same short "wi-" onset.
    // why: were ← the vowel of "we're" stretched, so it seems to have two syllables; will be / would be ← heard as a
    //   promise or a guess, with "be" filled in
    { id: 's1', skill: 'sound', level: 'B2', point: 'covered', reveals: ['amount'], seg: [38.8, 43.6],
      stem: 'Fill the gap: “I believe ___.”',
      choices: ['we’re covered', 'we were covered', 'we’ll be covered', 'we’d be covered'], a: 0,
      cue: '「believe」のあと、主語と動詞がつながる部分。',
      line: 'I believe *we’re covered*.',
      said: '「保険でカバーされてるはず」と言い返す。',
      mean: 'we’re は「ウィア」と一音節に近い。cover は保険で「補償される」という意味。',
      trap: 'were なら「前は入っていた」になる。今の話なので短い we’re。音節の数で聞き分ける。',
      use: 'Am I covered for this?（これ、保険きく？）' },

    // why: his reason ← "because" sets up a reason; sorry ← the Japanese frame of apologizing after a payment problem
    { id: 'r1', skill: 'predict', level: 'B2', point: 'youknow', seg: [43.6, 48.7], then: [48.7, 52],
      stem: 'Right after “Oh, because, you know what?”, what is Andy about to do?',
      choices: ['Act on a sudden decision', 'Give his reason for not paying', 'Say sorry for the mix-up'], a: 0,
      cue: '「because」のあとの決まり文句の働き。',
      line: 'Oh, because, *you know what?* … out of the way!',
      said: '「だって、あのさ…」と言いかけ、「どいて！」と飛び出す。',
      mean: 'You know what? は「よし決めた」の合図。because は時間かせぎ。',
      trap: 'because のあとは理由と思いやすいが、文は続かない。you know what? の次は行動。',
      use: 'You know what? Let’s just go.（よし、もう行こう）' },

    // R fix: V2 (blind 70 %): the key was the only warm, scene-level choice. All three are now plain plans built from
    //   what is said.
    // why: other doctor ← "one of the other doctors" is suggested first; insurance ← "insurance" comes up twice at the
    //   end
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plan', reveals: ['carefor', 'bridge'], seg: [61, 93.3],
      stem: 'After the ambulance, what do they settle on?',
      choices: ['Treating his lip themselves at home', 'Seeing one of the other doctors after all',
                'Checking what their insurance will pay for'], a: 0,
      cue: '「No more」のあと、「Let’s just」で始まる提案。',
      said: '別の医者に行く案は却下。家で看病し合い、裁縫セットで唇を縫えばいい、と話す。',
      mean: '医者をやめて、自分たちで何とかすると決める流れ。',
      trap: '最後に insurance が何度も出るが、調べる気はない。会話は「保険って何？」で終わる。',
      use: 'Let’s just stay in tonight.（今夜は家にいよう）' },

    // R fix: V2 (blind 70 %): "Sorry for dragging her" was a filler. Now "tired, but willing", the soft reading of a
    //   short "No".
    // why: scared ← the needles from the start of the clip; tired but willing ← "No. No more" heard as weary, not firm
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'nomore', reveals: ['scam'], seg: [63.5, 67.6],
      stem: 'How does Andy answer the idea of seeing other doctors?',
      choices: ['Angry, and sure they are all cheats', 'Scared, after so many needles today',
                'Tired, but he would go if she wanted'], a: 0,
      cue: '「No」の数と、そのあとの言い方。',
      line: '*No. No more doctors.* They’re a bunch of *scam artists*.',
      said: '「だめ。医者はもうたくさん。詐欺師の集まりだ」と言う。',
      mean: 'No を重ね、no more で「もうこりごり」。強い言葉で医者全体を責める。',
      trap: '最初の注射の話から「怖い」と取りやすいが、言っているのは怒り。no more ～ は「もう～はいらない」。',
      use: 'No more fast food. I’m done.（ファストフードはもうやめた）' },

    // R fix: V2 (blind 75 %) and S4: the key was the only money choice, so it matched the bill scene. Now three kinds
    //   of people, two of them about money. The segment ended inside "reel" (67.8 s), so it now ends at 67.6 s.
    // why: show-offs ← artist = 芸術家・名人, the katakana アーティスト; overcharge ← the $500 bill just before, a real
    //   but different complaint
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'scam', seg: [63.5, 67.6],
      stem: 'What is Andy calling the doctors?',
      choices: ['People who trick you for cash', 'People who show off their skill', 'People who charge too much'], a: 0,
      cue: '「a bunch of」のあとの2語。',
      line: 'They’re a bunch of *scam artists*.',
      said: '「医者なんて詐欺師の集まりだ」と言う。',
      mean: 'scam ＝ 詐欺。scam artist ＝ 人をだましてお金を取る人。artist は「その道の人」。',
      trap: 'アーティストで「腕のいい人」と取りやすい。前に scam があれば、だましの名人。',
      use: 'That website is a total scam.（あのサイト、完全に詐欺だよ）' },

    // R fix: V2 (blind 60 %) and S4: the key and "admits it was his own fault" were opposites, so one had to be the joke.
    //   Now "the ambulance hit him", a misreading of "run into". The segment started on "They're" (66.0 s); now 65.6 s.
    // why: drive badly ← "ambulance" is heard right after the doctors, the keyword trap; hit him ← "you run into an
    //   ambulance" heard the other way round
    { id: 'h2', skill: 'humor', level: 'C1', point: 'bam', reveals: ['reel'], seg: [65.6, 75.2],
      stem: 'Why does Andy’s warning about doctors get a laugh?',
      choices: ['He blames the doctors for a crash he caused', 'He says doctors drive their ambulances badly',
                'He claims the ambulance crashed into him'], a: 0,
      cue: '「Next thing you know」の前と後のつながり。',
      line: 'Reel you in with the free stuff. *Next thing you know, bam*, you run into an ambulance.',
      said: '「タダで釣られて、気づいたらドーン、救急車だ」と言う。',
      mean: 'ぶつかったのは自分なのに、医者のせいの話にしている。その筋の通らなさが笑い。',
      trap: 'run into を「ぶつけられた」と逆に取りやすい。run into ～ はこちらからぶつかること。',
      use: 'Next thing you know, it’s midnight.（気づいたら夜中だった）' },

    // R fix: V2 (blind 70 %): reworded the key so it isn't the only abstract choice, and both distractors now say what
    //   "every time" would claim on a literal reading. Segment start moved to 65.6 s, as h2. Still near 50 % blind (open).
    // why: before ← "Every time" taken literally, as his own history (a scope shift); warns her ← the generic "you"
    //   heard as April
    // anchor: 67.8–72.3 s every verb has the generic "you" ("reel you in", "Next thing you know", "you run into an
    //   ambulance"): a pattern for anyone, not a memory; 74.1 s "Every time." is added after a pause as the rule's seal
    { id: 'c1', skill: 'infer', level: 'C2', point: 'bam', reveals: ['reel'], seg: [65.6, 75.2],
      stem: 'What does “Every time” do to his story about doctors?',
      choices: ['Makes his one crash sound like what always happens', 'Admits he has run into ambulances before',
                'Warns April it will happen to her next'], a: 0,
      cue: '文の主語が、誰になっているか。',
      line: '*you* run into an ambulance. *Every time.*',
      said: '「タダで釣られて、気づいたらドーン、救急車。毎回だ」と言い切る。',
      mean: '一般の you を主語にして、一度きりの事故を「医者に行くと必ずこうなる」という法則にしている。大げさな一般化が笑い。',
      trap: 'every time を本当に何度もあった話と取りやすい。you が一般の人なら、話は法則になる。',
      use: 'You go out for one drink, and bam.（一杯だけのつもりが、ドーン）' },

    // R fix: V2 (blind 60 %): only the key carried a "like…" picture. All three now do.
    // why: wheel ← reel/wheel sound alike (/r/–/w/), and a hospital bed is on the mind; send home ← "free stuff" heard
    //   as gifts handed out at the end
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'reel', seg: [67.2, 71.2],
      stem: 'What does Andy say the doctors do with “the free stuff”?',
      choices: ['Hook you with it, like a fish', 'Wheel you in with it, like a patient',
                'Send you home with it, like a gift'], a: 0,
      cue: '「free stuff」の前の、短い動詞。',
      line: '*Reel you in* with the free stuff.',
      said: '「タダのものでこっちを釣って、引きこむんだ」と言う。',
      mean: 'reel in ＝ 釣り糸を巻いて魚を引き寄せる。無料をえさに客を呼ぶ、という悪口。',
      trap: 'reel と wheel は出だしが似ている。in と with のつながりから、引き寄せる動きを聞く。',
      use: 'They reel you in with low prices.（安さで客を釣るんだ）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'carefor', seg: [74.8, 77.4],
      stem: 'Type what he says: “Let’s just go home and ___.” (4 words)', answer: 'care for each other',
      cue: '「go home and」のあと。',
      line: 'Let’s just go home and *care for each other*.',
      said: '「もう家に帰って、お互いを看病しよう」と言う。',
      mean: 'care for ～ ＝ ～の世話をする。each other が「イーチャザ」とつながる。',
      trap: 'for が弱く「ファ」になり、care とつながって一語に聞こえる。語の数で確かめる。',
      use: 'We take care of each other.（お互いに助け合ってる）' },

    // why: joke ← sewing your own lip under a bridge sounds absurd, so it must be a gag; met with doubt ← "Mm-hmm" heard
    //   as a flat, unconvinced 相づち
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'romantic', reveals: ['carefor'], seg: [74.8, 83.5],
      stem: 'How is the sewing-kit plan offered and received?',
      choices: ['As a sweet idea, and taken that way', 'As a joke, and taken as one',
                'As a sweet idea, but met with doubt'], a: 0,
      cue: '提案の言葉と、相手の短い返事。',
      line: 'Let’s just go home and *care for each other*… — Mm-hmm, *so romantic*.',
      said: '「家で看病し合おう、橋の下で唇を縫って」に「うん、ロマンチック」。',
      mean: '二人とも本気で甘い計画だと思っている。変な計画を本気で喜ぶ二人。',
      trap: '中身が変なので冗談に聞こえるが、care for each other は本気の言葉で、返事もそのまま受ける。',
      use: 'That’s so sweet of you.（優しいね）' },

    // R fix: V2 (blind 60 %): the key was the only "couple" choice. All three now describe her, so the key is no longer
    //   the odd one out.
    // why: plays along ← "Mm-hmm" heard as a flat 相づち, the Japanese frame; teasing ← "so romantic" heard as sarcasm
    //   about a sewing kit under a bridge
    // anchor: 75.3–77.0 s "care for each other" is offered with no joke marker; 81.7–82.5 s "Mm-hmm, so romantic" has
    //   no "but" and no change of subject; 87.8–91.9 s they keep planning it ("Do you think sewing kits are covered…?")
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'romantic', reveals: ['carefor', 'bridge'], seg: [74.8, 92],
      stem: 'What does the reply to the bridge plan tell us about the couple?',
      choices: ['She likes the odd plan as much as he does', 'She agrees only so the talk can end',
                'She is teasing him about the cheap plan'], a: 0,
      cue: '短い返事のあと、話がどう続くか。',
      line: 'underneath the bridge somewhere. — Mm-hmm, *so romantic*. … Do you think *sewing kits* are covered…?',
      said: '橋の下で唇を縫う計画に「うん、ロマンチック」と返し、二人はそのまま裁縫セットの話を続ける。',
      mean: '皮肉なら話はそこで止まるが、二人は乗り気で続ける。普通なら困る計画を甘いと感じる、似た者同士だと分かる。',
      trap: '中身の変さから皮肉と取りやすい。皮肉かどうかは、そのあと話がどう続くかで確かめる。',
      use: 'Cheap pizza at home? My kind of date.（家で安いピザ？最高のデート）' },

    // R fix: V2 (blind 70 %): the key was the only odd place. "The back of the ambulance" (a word said earlier) is now as
    //   odd as the key.
    // why: home ← "go home" was said just before; ambulance ← the crash just before, and where first aid happens
    { id: 'd3', skill: 'detail', level: 'B1', point: 'bridge', seg: [77.2, 81.6],
      stem: 'Where does he picture her sewing up his lip?',
      choices: ['Under a bridge somewhere', 'At home on their couch', 'In the back of an ambulance'], a: 0,
      cue: '「my lip」のあとの、場所の言葉。',
      line: 'You could sew up my lip *underneath the bridge* somewhere.',
      said: '「どこかの橋の下で、君が僕の唇を縫えばいい」と言う。',
      mean: 'underneath ＝ ～の下。家ですらなく橋の下、という発想が笑いどころ。',
      trap: '直前の go home から家と取りやすい。場所は lip のあと、underneath で始まる。',
      use: 'It’s just underneath the station.（駅のすぐ下だよ）' },

    // R fix: V2 (blind 60 %): "only pays for doctors" was weak. Now a joking reading (they know and are making fun of
    //   the desk), which "What is insurance?" refutes only if heard as a real question.
    // why: cheat it ← groceries and Xbox games sound like slipping things past it; joking ← the list sounds like a gag
    //   aimed at the woman at the desk
    { id: 'i4', skill: 'infer', level: 'B2', point: 'what', reveals: ['thing'], seg: [87, 93.3],
      stem: 'What do the last questions about insurance show?',
      choices: ['Neither of them knows what it is', 'He plans to cheat it on purpose', 'They are mocking the desk’s rules'],
      a: 0,
      cue: '質問の並びと、最後の短い質問。',
      line: 'covered by insurance? Or groceries? Or, like, *Xbox games*? — *What is insurance?*',
      said: '「裁縫セットは保険きく？食料品は？ゲームは？」に「保険って何？」と返る。',
      mean: '保険が何かも知らずに「カバーされてる」と言っていた。二人とも仕組みを知らない。',
      trap: 'ゲームまで並ぶとずるい計画に聞こえるが、最後の質問が答え。分かっていない人の質問の並び。',
      use: 'Wait, what does that even mean?（待って、それってどういう意味？）' },
  ]
};
