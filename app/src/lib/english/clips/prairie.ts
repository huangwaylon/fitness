// “Leslie on the Prairie | Parks and Recreation” (the official Parks and Recreation channel, Season 5): at the old
// prairie village, Leslie takes on the reenactor Garth in a contest to live like it's 1817, with Andy and Tom as
// referees; Garth won't quit, a look at his phone shows he has no friends, Leslie lets him win and then talks him into
// joining the Pawnee Historical Commission.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈260 s. Untested: 54–59 s (“butter churn”
// vs captions “butter gyre”), 102–108 s (the “husband and wife” line, speakers unclear), 114–121 s (a found object,
// visual), 153–157 s (“goober peas”), 188–195 s (the “birthing stick”), 204–206 s (“the day is mine” vs captions
// “the date is mine”), and the Risk and X-Men lines (world knowledge).
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 0
//   Open: nt2 (C2) is still the "hidden eagerness" reading a test-wise reader expects from “trying not to say”.
//   (Removed both ear checks: d1's key holds on either version, and pr1 doesn't depend on who greets her.)
import type { Clip } from '../types.ts';

export const prairie: Clip = {
  id: 'prairie', video: 'IDZyTjLPqSI', title: 'Leslie on the Prairie', dur: 281, wpm: 172,
  band: 'fast', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: just arrived too ← "just getting here" taken as about himself; real question ← "just getting here?" heard
    //   with a rising tone, as a plain check
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'early', reveals: ['sleep'], seg: [12.8, 24.7],
      stem: 'When Leslie arrives, what does the first remark to her do?',
      choices: ['Teases her for showing up so late', 'Says he has only just arrived too',
                'Checks whether she has just arrived'], a: 0,
      cue: '一言目の最後の短い二語と、その後の会話。',
      line: 'Oh, *just getting here, I see*. — Yikes. Did you sleep here last night?',
      said: '朝早く来たレスリーに「今ごろ到着ですか」と言う。相手は夜明け前から作業済み。',
      mean: 'I see を付けた「今来たのね」は、遅いとからかう決まった形。',
      trap: '文字通りの確認に聞こえるが、I see は「見れば分かる」。答えを待つ質問ではない。',
      use: 'Oh, just waking up, I see.（今起きたんだ、へえ）' },

    // why: cable installer ← "chased off an interloping cable installer" is something he did, not why he came;
    //   sleeping the old way ← a reenactor's likely reason, but he gives the chores as his
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sleep', seg: [16.5, 24.7],
      stem: 'Why did Garth stay at the village overnight?',
      choices: ['To start the chores first thing', 'To keep a cable installer away',
                'To get used to sleeping the old way'], a: 0,
      cue: '「I want to be here」のあと、to のあと。',
      line: 'I want to be here… to *get the chores done*. Already I’ve done the preserves…',
      said: '「朝一番に家の仕事を片づけたい」と言う。ジャム作りも済んだ。',
      mean: 'get the chores done ＝ 家の仕事を済ませる。これが理由。',
      trap: 'preserves や installer は済んだこと。理由は want to のあと。',
      use: 'I want to get the chores done early.（家事を早めに済ませたい）' },

    // R fix: V2 (blind 85 %): the key was the only endurance choice next to the title; all three are now ways to win
    // why: chores ← "the cock crows… get the chores done" (said, but it's why he slept there, not the contest's rule);
    //   referees ← "you will be our referees" heard as judges who score them
    { id: 'g1', skill: 'gist', level: 'B2', point: 'contest', seg: [24.5, 72.6],
      stem: 'What will decide who wins Leslie and Garth’s contest?',
      choices: ['Who can hold out longer without modern things', 'Who gets through more old chores without help',
                'Who the referees score higher on prairie skills'], a: 0,
      cue: '最後のほう、レスリーが心配していること。',
      line: 'let’s put all *modern devices* in this pail… I just don’t think he’s *ever gonna quit*.',
      said: '現代の道具はバケツに入れさせ、最後は「彼はやめそうにない」とレスリーがこぼす。',
      mean: '道具を使わず、先に音を上げた方が負け。我慢比べだと quit で分かる。',
      trap: 'chores や referees は聞こえるが点数の話はない。勝負は「やめるかどうか」。',
      use: 'I’m not gonna quit now.（今さらやめないよ）' },

    // why: 1807 ← "eighteen" heard, "seventeen" lost; 1870 ← -teen/-ty; 1917 ← "seventeen" heard, first half lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', seg: [26.9, 31.4], keep: true,
      stem: 'Things invented after which year are not allowed?',
      choices: ['1807', '1817', '1870', '1917'], a: 1,
      cue: '「invented past」のあとの年。',
      line: 'Nothing can be used that was invented past *1817*.',
      said: '「1817年より後に発明された物は使えない」とルールを言う。',
      mean: 'past ＝ 〜より後。年は18と17に分けて読む。',
      trap: 'seventeen と seventy は語尾で区別する。-teen は長く強く、-ty は短い。',
      use: 'Nothing past nine, okay?（9時以降はなしね）' },

    // R fix: V2 (blind 55 %): the key was the only joke-shaped reason; all three are now two-part and as odd
    // why: bet ← a sitcom reason for a favor, and "Leslie said…" sounds like a deal; neither paid ← "I'm doing it for
    //   free" is the last thing heard, laid over both
    { id: 'd1', skill: 'detail', level: 'B2', point: 'referee', seg: [31.2, 40.5],
      stem: 'What do the two referees say about why they are there?',
      choices: ['One is paid, and the other had nothing better to do', 'One is paid, and the other lost a bet to Leslie',
                'Neither is paid; both had nothing better to do'], a: 0,
      cue: 'カメラへの二人の一言を、それぞれ最後まで。',
      line: 'Leslie said… a *hundred bucks*. — And I had *nothing better to do*. I’m doing it for free.',
      said: '一人は「100ドルもらう」、もう一人は「暇だったから、ただでいい」と話す。',
      mean: 'nothing better to do ＝ 暇だったから。善意ではない。',
      trap: '最後の for free が残ると二人とも無料に聞こえる。一人ずつ理由を聞く。',
      use: 'I had nothing better to do.（ほかにやることもなかったし）' },

    // R fix: V2 (blind 55 %): the smell key was the only body-joke; distractors are now about her body and clothes too
    // why: itchy dress ← "old-timey dress" is on the same checklist; sick ← "rickets… cured" just before, so "rough"
    //   heard as health
    { id: 'i2', skill: 'infer', level: 'B2', point: 'rough', seg: [46.55, 54.25],
      stem: 'In Leslie’s checklist, what will get a little rough?',
      choices: ['How she will smell by the end', 'How itchy the old dress will feel',
                'How sick she might get out here'], a: 0,
      cue: '直前の一語「Not allowed」の対象。',
      line: 'Antiperspirant? *Not allowed*. *Might get a little rough in there*.',
      said: '「制汗剤は禁止。ちょっと大変なことになるかも」と言う。',
      mean: 'in there は服の中。制汗剤なしで、においがきつくなるという冗談。',
      trap: 'rough は体調にも服にも使える。直前の Not allowed の対象とつなげて決める。',
      use: 'It might get a little rough.（ちょっと大変なことになるかも）' },

    // why: fixed it ← "moved" heard as moving the fridge; saved the food ← the usual sensible thing to do
    { id: 'i1', skill: 'infer', level: 'C1', point: 'fridge', seg: [62.4, 68.1],
      stem: 'What does the referee’s fridge story show about him?',
      choices: ['He gives up the moment a modern thing breaks', 'He fixed the fridge by moving it on his own',
                'He kept the food safe somewhere else cold'], a: 0,
      cue: '最後の短い文の動詞が、何を動かしたか。',
      line: 'my refrigerator stopped working, I didn’t know what to do. *I just moved.*',
      said: '「冷蔵庫が壊れたとき、どうしていいか分からず、引っ越した」と話す。',
      mean: 'move だけなら「引っ越す」。直すより家ごと替える、便利な物なしでは何もできない人。',
      trap: 'moved を「冷蔵庫を動かした」と取りやすい。目的語がなければ引っ越し。',
      use: 'We just moved here last month.（先月ここに引っ越してきた）' },

    // why: butter itself ← the next line, "Butter is my favorite food", comes after the list; hates ← a list that
    //   turns on itself is a common gag, but he calls them all "my favorite foods"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'grapes', seg: [77.9, 87.0],
      stem: 'What makes the end of Andy’s list of foods funny?',
      choices: ['It ends on a fruit nobody eats with butter', 'It ends on butter itself, eaten on its own',
                'It ends on a food he just said he hates'], a: 0,
      cue: '4つ目の食べ物と、ほかの3つとの違い。',
      line: 'All my favorite foods have butter on ’em. Pancakes, toast, popcorn, *grapes*.',
      said: '「好きな食べ物はみんなバター付き。パンケーキ、トースト、ポップコーン、ぶどう」。',
      mean: '自然な3つのあとに、ありえない1つを置く。並べ方の落ちで笑わせる。',
      trap: '最後の語を聞き逃すと、次の「バターが好物」が落ちに思える。4つ目を前の3つと比べる。',
      use: 'I put hot sauce on everything.（何にでもホットソースをかける）' },

    // R fix: V2 (blind 60 %): "well ahead of Garth" isn't an admission, so the key stood out; all three are now admissions
    // why: worrying ← "head" read literally (頭で考えすぎ); can't back out ← "in over" heard as "in too deep" (引くに引けない)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'overhead', seg: [93.8, 101.9],
      stem: 'In her comment after the butter scene, what does Leslie admit?',
      choices: ['The contest is more than she can handle', 'She has been worrying about it far too much',
                'She has gone too far to back out now'], a: 0,
      cue: '最初の文と、そのあと彼をほめる理由。',
      line: 'I think *I’m in over my head*. Garth really knows his stuff.',
      said: '「手に負えないかも。ガースは本当に詳しい」と、畑の話を続ける。',
      mean: 'in over my head ＝ 自分の力を超えている。深い水で足がつかない感覚。',
      trap: 'head から「考えすぎ」、in over から「引けない」と思いやすい。直後の一言で判断。',
      use: 'I’m in over my head at this job.（この仕事は手に負えない）' },

    // R fix: V2 (blind 50 %): "tools and engines" was a filler; now a by-the-book reading of "machine"
    // why: cold ← "machine" as robot-like, no feelings (Japanese frame); by the book ← machine-like precision, which
    //   suits a reenactor
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'machine', seg: [121.3, 130.1],
      stem: 'What does the referee mean when he first sums up Garth here?',
      choices: ['He just keeps going and never tires', 'He seems cold, with no feelings',
                'He follows every rule to the letter'], a: 0,
      cue: '最初の一文と、最後の一文をつなげる。',
      line: 'Garth is *a machine*… It’s like he’s *getting stronger the longer he stays*.',
      said: '「ガースは機械だ。いればいるほど強くなる」と言う。',
      mean: 'a machine ＝ 疲れ知らずで動き続ける人。ほめ言葉で使う。',
      trap: '日本語の「機械的」は冷たい印象だが、英語のこの言い方はタフさのほめ言葉。',
      use: 'She’s a machine at the gym.（彼女はジムで疲れ知らずだ）' },

    // why: half an hour ← "an hour" heard with a lost "half"; four hours ← "an hour" linked into "fower"
    { id: 'n2', skill: 'number', level: 'B1', point: 'hour', seg: [121.3, 130.1], keep: true,
      stem: 'How long did the referee expect Garth to last?',
      choices: ['Half an hour', 'An hour', 'Four hours'], a: 1,
      cue: '「gonna last」のあと。',
      line: 'I thought he was gonna last *an hour, max*.',
      said: '「せいぜい1時間でやめると思ってた」と言う。',
      mean: 'max ＝ せいぜい、最大でも。それより長くは持たないという予想。',
      trap: 'an hour がつながって「アナウア」に聞こえる。four の f は聞こえない。',
      use: 'It’ll take ten minutes, max.（せいぜい10分で終わる）' },

    // R fix: V2 (blind 75 %): "really think" and the only two-sided key gave it away; all three now turn on a contrast
    // why: more fun ← "so, so fun" plus "the longer he stays" just before; kids vs adults ← "school field trip"
    //   heard as the split
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'livelike', seg: [135.3, 146.3],
      stem: 'After Garth shows off his hoop, what is Leslie’s view of prairie life?',
      choices: ['Fine for a short visit, but no way to live', 'Dull at first, but more fun the longer you stay',
                'Fun for kids, but too hard for grown-ups'], a: 0,
      cue: '「so fun」の連続のあと、But で始まる文。',
      line: 'It’s fun to be here on… a *school field trip*… So, so fun. *But to live like this is insane*.',
      said: '「遠足で来るなら楽しい、すごく楽しい。でも暮らすのは正気じゃない」と言う。',
      mean: '楽しさを繰り返すのは前置き。本音は but のあと。',
      trap: 'so, so fun や school が残ると「慣れれば楽しい」「子ども向け」に思える。But のあとを聞く。',
      use: 'Fun to visit, but I couldn’t live there.（行くのは楽しいけど住めない）' },

    // why: Facebook only ← the list ends on "his Facebook page", heard as the one thing they'll look at; gives it back ←
    //   "invasion of his privacy" heard as a change of heart
    { id: 'h3', skill: 'humor', level: 'C1', point: 'privacy', seg: [160.6, 168.0],
      stem: 'Why is the plan for Garth’s phone funny?',
      choices: ['They rule out reading, then list everything to read', 'They rule out reading, then just check his Facebook',
                'They rule out reading, then hand the phone back'], a: 0,
      cue: '「let’s just look at」のあと、いくつ並ぶか。',
      line: 'let’s *not read anything*. That’s an invasion of his privacy. Let’s *just* look at his browser history and his inbox and his outbox…',
      said: '「読むのはやめよう、侵害だ。履歴と受信箱と送信箱だけ見よう」と言う。',
      mean: 'just（〜だけ）と言いながら、中身を全部挙げる。言葉と行動の食い違いが笑い。',
      trap: '最後の Facebook だけ残ると、控えめな案に聞こえる。just のあとは数を数える。',
      use: 'Let’s just have one drink.（1杯だけにしよう）' },

    // why: 2 days ← "twelve" with the "tw" heard, the rest lost; 20 days ← -lve/-nty
    { id: 'n3', skill: 'number', level: 'B1', point: 'days', seg: [167.95, 176.05], keep: true,
      stem: 'How long has it been since Garth got an email?',
      choices: ['2 days', '12 days', '20 days'], a: 1,
      cue: '「hasn’t gotten an email in」のあと、間をおいて。',
      line: 'He hasn’t gotten an email in… *12 days*?',
      said: '新しいメールがない。「12日もメールが来てないの？」と驚く。',
      mean: '現代人には信じられない長さ。だから次に「幽霊？」と言う。',
      trap: 'twelve の最後の v は弱く、twenty の nty と混ざりやすい。母音「エ」の長さで聞く。',
      use: 'I haven’t had coffee in three days.（3日コーヒーを飲んでない）' },

    // R fix: V2 (blind 60 %) and K1: the stem now asks what the group concludes (the "no friends" line settles it);
    //   the distractors are other readings of answering spam
    // why: polite ← answering every message sounds like good manners; trusting ← answering spam sounds gullible
    { id: 'i3', skill: 'infer', level: 'B2', retired: true, point: 'lonely', seg: [175.9, 183.2],
      stem: 'What does the group conclude from Garth answering spam?',
      choices: ['He has nobody else to write to', 'He is too trusting to spot a scam',
                'He is too polite to ignore anyone'], a: 0,
      cue: 'spam の話のあと、別の人の短いまとめ。',
      line: 'The only ones he gets are spam! And *he responds to them*! … This guy *has no friends*.',
      said: '「来るのは迷惑メールだけ、しかも返信してる」「この人、友だちいないんだ」。',
      mean: '迷惑メールにまで返事をするのは、話し相手がいないから。まとめの一言が決め手。',
      trap: '礼儀正しさや、だまされやすさと取りやすい。そのあとのまとめの一言で、皆の読み方が決まる。',
      use: 'He never responds to my texts.（彼、私のメールに全然返事しない）' },

    // C2: who the joke is on (cf. i3)
    // anchor: 181.4–185.4 s "This guy has no friends." — "I don't know. Seems like he's friends with that mule.": the
    //   "I don't know" sounds like a defense, but the only friend it can name is an animal
    // R fix: V2 (blind 65 %): the key was the only "though it sounds like…" twist; all three now have one
    // why: first speaker ← "I don't know" heard as real pushback against a harsh judgment; the group ← the privacy joke
    //   just before, so the snooping looks like the target
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'mule', reveals: ['lonely'], seg: [180.7, 186.2],
      stem: 'In the reply about the mule, who is the joke on?',
      choices: ['Garth, though it sounds like it defends him', 'The first speaker, though it sounds aimed at Garth',
                'The whole group, though it sounds aimed at Garth'], a: 0,
      cue: '「I don’t know」で始まる返事が、誰を友だちに挙げるか。',
      line: 'This guy *has no friends*. — I don’t know. *Seems like he’s friends with that mule*.',
      said: '「友だちがいない」に、別の人が「どうかな。あのラバとは友だちみたいだよ」と返す。',
      mean: 'I don’t know は反論の形だが、挙げる友だちは動物だけ。かばうふりで、さびしさを念押ししている。',
      trap: 'I don’t know を本気の反対と取ると、前の人への皮肉に見える。反論の中身を聞く。',
      use: 'Well, he does have his cat.（まあ、猫はいるしね）' },

    // R fix: V2 (blind 60 %): the key was the only two-step reaction; all three are now two-step
    // why: angry then won over ← "Violation!" is the loudest part, and the order gets flipped; shy ← "I mean" heard as
    //   embarrassed backing off
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'clothes', seg: [195.0, 201.1],
      stem: 'How does Garth react when he sees Leslie’s new clothes?',
      choices: ['Charmed at first, then quick to call the foul', 'Angry at first, then won over by her looks',
                'Charmed at first, then too shy to say more'], a: 0,
      cue: '最初のほめ言葉のあと、I mean で何に言い直すか。',
      line: '*You look beautiful.* I mean, you changed clothes! *Violation!*',
      said: '「きれいだ」と言い、「いや、服を替えたな！反則だ！」と言い直す。',
      mean: '本音のほめ言葉が先に出て、I mean で勝負の話に戻る。うっかりと勝負心の両方。',
      trap: 'Violation! で順番が逆に思え、I mean は照れにも聞こえる。言い直す先を聞く。',
      use: 'You look great. I mean, you look ready.（すてき。いや、準備万端だね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'cant', seg: [200.3, 203.95],
      stem: 'Type what Leslie says: “I admit. ___. You win.” (5 words)', answer: "i can't take it anymore",
      cue: '「I admit」と「You win」のあいだ。',
      line: 'I admit. *I can’t take it anymore*. You win.',
      said: '「認める。もう耐えられない。あなたの勝ち」と負けを宣言する。',
      mean: 'can’t take it anymore ＝ もう我慢できない。限界を認める決まり文句。',
      trap: 'can’t の t は消え、take‿it がつながる。弱い it を落とさずに書く。',
      use: 'I can’t take this heat anymore.（この暑さはもう無理）' },

    // R fix: V2 (blind 60 %) and §9.5: "I'm gotta" and "gonna mix saying" weren't real English, so only two choices
    //   were live; now three grammatical ones
    // why: not gonna ← a winner's "won't miss it" frame, and a weak "not" is easy to imagine; keep ← a winner keeps
    //   cheering, and "gonna k-" vs "gonna m-" is one short consonant
    { id: 's1', skill: 'sound', level: 'B2', point: 'huzzah', seg: [207.4, 210.9],
      stem: 'Fill the gap: “I’m ___ saying huzzah.”',
      choices: ['gonna miss', 'not gonna miss', 'gonna keep'], a: 0,
      cue: '「I’m」のあと、二語がつながる所。',
      line: 'I-I’m *gonna miss* saying huzzah. — Yeah.',
      said: '勝ったガースが「フザー（万歳）が言えないのはさびしい」と言う。',
      mean: 'gonna miss ＝ 〜がなくなるとさびしい。',
      trap: '勝った人の言葉なので「もう言わない」「言い続ける」と思いやすい。miss‿saying は s が重なる。',
      use: 'I’m gonna miss this place.（ここがなくなるとさびしいな）' },

    // R fix: V2 (blind 55 %): "pay her back" was a filler; now a marriage reading of "proposal"
    // why: rematch ← "another proposition" heard as another challenge, after the contest; marry ← "proposition" heard as
    //   a proposal (プロポーズ)
    { id: 'h4', skill: 'humor', level: 'C1', point: 'date', seg: [210.2, 218.8],
      stem: 'Why does Garth’s answer to Leslie’s new proposal get a laugh?',
      choices: ['He thinks she is asking him out on a date', 'He thinks she is asking him to marry her',
                'He thinks she wants a rematch of the contest'], a: 0,
      cue: '彼女が中身を言う前に、彼が何に Yes と言うか。',
      line: 'I have *another proposition*. — *Yes, I will go out on a date with you*, but… *I will let you pay*.',
      said: '「もう一つ提案が」に、「デートならいいよ。現代の女性だから払わせてあげる」と答える。',
      mean: '頼まれてもいないデートを受け、払うのは彼女。勘違いと古い男らしさ。',
      trap: 'proposition から「再戦」や結婚を思いやすい。Yes のすぐあとの動詞句を聞く。',
      use: 'Wait, I haven’t even asked yet.（待って、まだ何も頼んでない）' },

    // R fix: V2 (blind 50 %): the key was the only one with the clip's "trial"; it's now paraphrased, and "May" pairs with
    //   the cousin's court date
    // why: soap time ← "a big bite out of my soap-making time" is said, but as a worry, before the yes; after May ←
    //   "my cousin's arraignment is in May" heard as a delay (he says it's only a day)
    { id: 'g2', skill: 'gist', level: 'B1', point: 'trial', seg: [218.7, 260.0],
      stem: 'How does Garth answer Leslie’s offer in the end?',
      choices: ['He agrees to try it out for now', 'He agrees to join once May is over',
                'He says no, to protect his soap time'], a: 0,
      cue: '最後の「Yes」の前の三語。',
      line: '*On a trial basis, yes.* Yes! Yes! — Great. Welcome to the team.',
      said: '史跡委員会への誘いを最初は断るが、最後は「お試しでなら、はい」と受ける。',
      mean: 'on a trial basis ＝ お試しで。結局は入会し、レスリーが歓迎する。',
      trap: 'soap や May の話で断りに聞こえるが、それは前置き。最後の Yes が答え。',
      use: 'Let’s try it on a trial basis.（お試しでやってみよう）' },

    // why: meetings ← Leslie's list of meetings and parties comes later, so it sounds like his reason; know less ←
    //   "clowns" heard as "they don't know history"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'clowns', seg: [218.7, 230.5],
      stem: 'Why does Garth turn down the commission at first?',
      choices: ['They never answered his complaints to them', 'They have too many meetings and parties',
                'They know far less history than he does'], a: 0,
      cue: '「No, thank you」のあとの長い文。',
      line: 'Those clowns? No, thank you. They *haven’t answered a single one of my complaints*…',
      said: '「あの連中？お断り。会報のフォントの件で何度も苦情を出したのに、一つも返事がない」。',
      mean: 'clowns ＝ ふざけた連中、という悪口。断る理由は苦情の無視。',
      trap: 'clowns から「知識がない」と取りやすい。理由は They haven’t のあと。',
      use: 'They haven’t answered a single email.（メール一通にも返事がない）' },

    // C2: what the framing does (cf. i3)
    // anchor: 181.4 s "This guy has no friends"; 234–244 s every "problem" is time with people ("people who also love
    //   history", "many social occasions", "cocktail parties"); 257 s his "Yes! Yes!"
    // R fix: V2 (blind 60 %): the key was the only "without saying so"; the choices are now parallel in that frame.
    //   S4: the segment was 28.6 s; it's now the list itself (233.0–247.4), so it no longer reveals `trial`
    // why: warn him off ← "the only problem is" taken at face value, as a fair warning to a loner; test him ← "I can
    //   understand if it's something you don't want to commit to" heard as a test of commitment
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'lonely', seg: [233.0, 247.4],
      stem: 'Why does Leslie list the meetings and parties as “the only problem”?',
      choices: ['To offer the company he lacks without saying so', 'To warn him off politely, since he avoids people',
                'To test his commitment without saying so outright'], a: 0,
      cue: '「problem」として並ぶ物の中身。',
      line: 'the only problem is… *people who also love history*, and many *social occasions*… like *cocktail parties*',
      said: '「問題は会議が多いこと、歴史好きの人との作業、パーティーにも出ないといけないこと」と並べる。',
      mean: '欠点として並べるのは、友だちのいない彼が欲しい物ばかり。さびしさに触れずに、仲間を差し出している。',
      trap: 'problem を本当の注意と取りやすい。欠点の中身が、前の場面の彼にとって何かを考える。',
      use: 'The downside is free pizza every Friday.（難点は毎週金曜のピザ）' },

    // C2: what he is trying not to say (cf. g2)
    // anchor: 247.7–258.2 s the excuses shrink as he talks ("my cousin's arraignment is in May, but that's like a
    //   day… I come back the same day"), then "On a trial basis, yes. Yes! Yes!"
    // R fix: V2 (blind 70 %): the key's "how much he really wants" read as the hidden-truth choice; reworded in the
    //   same shape as the others (partial: the type itself invites the eager reading)
    // why: too busy ← the soap-making excuse taken at face value; grudge ← "Those clowns" and the ignored complaints
    //   earlier, so the hesitation sounds like resentment
    { id: 'nt2', skill: 'attitude', level: 'C2', retired: true, point: 'trial', seg: [245.0, 259.0],
      stem: 'When Garth mentions his soap making, what is he trying not to say?',
      choices: ['That he would love to say yes right away', 'That he has no time for it at all',
                'That he is still angry about his complaints'], a: 0,
      cue: '言い訳がだんだん小さくなる流れと、最後の返事。',
      line: 'such a *big bite* out of my soap-making time… but *that’s like a day*… *Yes! Yes!*',
      said: '「石けん作りの時間が減る」「いとこの裁判も…でも1日だけ」と言い、最後は「はい！はい！」。',
      mean: '忙しいふりは、すぐ飛びつかないための体裁。言い訳を自分で小さくしていき、本心が最後に出る。',
      trap: '言い訳を額面どおり取ると「忙しい人」になる。言い訳が自分で崩れていったら、本音は逆。',
      use: 'Well, I suppose I could make time.（まあ、時間は作れなくもないけど）' },
  ]
};
