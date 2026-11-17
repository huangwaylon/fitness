// “Lice Invasion - The Office US” (the official The Office channel, Best of Season 9): lice turn up in the office, and
// everyone is quick to blame Meredith; Dwight quarantines the clean ones, Pam keeps trying and failing to tell Meredith
// something, Meredith shaves her head, and they settle on mayonnaise.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 274 s. Names said: Meredith (Palmer),
// Dwight, Pam, Angela. The head-checker is never named, so stems call her that. Untested on purpose: 63.9–67.5 s
// ("beanbag orgies": sexual), 80–95 s (rapid finds over each other), 109–129 s (the hazmat bit: kept to its renting
// line), 156.8–158.6 s ("migrated from down south": innuendo), 176.7–181.6 s (the lice name list holds a slur), 189–193 s
// (whisper "To be burned! — To be washed", captions "should be washed"), 225.6 s (garbled in both), 227–232 s (Meredith's
// "the balls to…"), 265–274 s (cigarette brands; the last line is "cubes" in whisper, "pubes" in captions).
// EAR CHECK: 145–174 s c2 — the one who starts "Meredith, I need to tell you something", answers "Nothing" and talks
//   to camera is taken as Pam (no name in this stretch; Pam is named at 72.1 s and 264.4 s in the same storyline)
// EAR CHECK: 223.0 s s1 — "We don't want it to last longer": the weak "don't" (both sources have it)
// REVIEW 2026-11-16: pass 5, fix 16, drop 2, new 0; ear checks 2
// REVIEW open: who says "Not that it looks bad, Meredith…" (240.3 s)? Never named; m1 and p3 are now worded so it
//   doesn't matter.
import type { Clip } from '../types.ts';

export const liceOffice: Clip = {
  id: 'liceoffice', video: 'K1HHUx7CNC0', title: 'Lice Invasion', dur: 295, wpm: 150, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: 12 ← twelve and twenty-two share the "tw-" onset; 20 ← the "-two" runs into "times" and gets lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'times', seg: [0, 6.9], keep: true,
      stem: 'How many times does the head-checker say she has had lice?',
      choices: ['12 times', '20 times', '22 times'], a: 2,
      cue: '「I had lice」のすぐあとの数字。',
      line: 'Between the foster homes and the orphanage, I had lice *22 times*.',
      said: '「里親の家と孤児院で、シラミには22回なった」と言う。',
      mean: 'だから「任せて」と言える。調べる役を引き受ける理由。',
      trap: 'twenty-two の two が times につながり、twenty に聞こえやすい。数字は最後まで聞く。',
      use: 'Trust me, I’ve done this before.（任せて、前にもやったことあるから）' },

    // R fix: blind 65 %: "get down behind their desks" was a filler. Now "line up to get their heads checked", the
    //   next step the scene seems to call for; "we've got lice" says only that lice are here.
    // why: pencils away ← pencils down taken literally, as a safety step; line up ← "we've got lice" heard as the start
    //   of a head check for all
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'pencils', seg: [7.4, 11.8],
      stem: 'What does she tell everyone to do right after finding one?',
      choices: ['Stop the work they’re doing', 'Put their pencils away safely', 'Line up to get their heads checked'], a: 0,
      cue: '「a big one」のあと、全員への呼びかけ。',
      line: 'All right, *pencils down* everyone, we’ve got lice.',
      said: '大きいのを見つけて、「はい、みんな手を止めて。シラミが出た」と言う。',
      mean: 'pencils down ＝ 試験の「鉛筆を置いて」。手を止めて、とふざけて使っている。',
      trap: '文字通り鉛筆の話と取りやすい。学校の決まり文句を、オフィスに持ちこんでいる。',
      use: 'Okay, pencils down. Time for lunch.（はい、手を止めて。お昼にしよう）' },

    // R fix: blind 70 %: "stay calm and wait" was a filler (Dwight shouts "full quarantine"). Now "pin it on Dwight",
    //   whose own lice story fills 28–47 s; the names the blame falls on settle it.
    // why: Dwight ← he tells a long story about having lice, so he seems to be the suspect; no one to blame ← "we
    //   don't know for sure" taken as the group's view
    { id: 'g1', skill: 'gist', level: 'B2', point: 'blame', reveals: ['angela'], seg: [7.4, 104.0],
      stem: 'Once the lice are found, how does the office react?',
      choices: ['They are quick to pin it on Meredith', 'They are quick to pin it on Dwight',
                'They agree that no one is to blame'], a: 0,
      cue: '何度も出てくる名前と、その言われ方。',
      line: 'Oh God, *Meredith*, lice? … *Not when it comes to Meredith*.',
      said: 'シラミが出ると、すぐ「Meredith か」という声が上がり、ほかの人も彼女のせいにする。',
      mean: '証拠はないのに、ふだんの印象で犯人が決まる。かばう声は一人だけ。',
      trap: '「落ち着いて」「確かじゃない」の声は一人ずつ。全体の流れは名前の出方で分かる。',
      use: 'Let’s not jump to conclusions.（早とちりはやめよう）' },

    // R fix: blind 55 %: "names he uses for lice" leaned on an untested later stretch. Now its mirror, "the names are
    //   all about lice" (taking "all because I had lice" on trust), which the names themselves refute.
    // why: proud ← the list comes in one breath, like a record of achievements; all about lice ← "all because I had
    //   lice" believed, so the names seem to be lice taunts
    { id: 'h1', skill: 'humor', level: 'C1', point: 'names', seg: [38.5, 47.3],
      stem: 'Why does Dwight’s list of what he was called get a laugh?',
      choices: ['The names point to reasons other than lice', 'He says the names as if they were praise',
                'The names he lists are all about lice'], a: 0,
      cue: 'あだ名の並びと、最後の「all because」。',
      line: 'they called me freak and four eyes and sci-fi nerd and *girl puncher*, *all because I had lice*…',
      said: '「15年間、変人、メガネ、SFオタク、女の子を殴るやつと呼ばれた。全部シラミのせい」。',
      mean: 'あだ名はどれもシラミと関係がない。本人だけが原因をシラミだと思っている。',
      trap: 'all because を信じると昔話。理由と中身が合わないところが笑いどころ。',
      use: 'It’s all because of that one mistake.（全部あの一つのミスのせい）' },

    // R fix: blind 70 %: both distractors were "rest", so the key was the odd one out. "Day off" is now "keep away
    //   from her for a while" (a break from her, and lice spread), which the defense in the next line refutes.
    // why: short rest ← break = 休憩, the katakana ブレイク; keep away ← "a break" read as distance from her, and lice
    //   are catching
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'break', seg: [67.7, 71.6],
      stem: 'What is Pam asking the others to do for Meredith?',
      choices: ['Stop being so hard on her', 'Let her take a short rest', 'Keep away from her for a while'], a: 0,
      cue: '「Let’s」で始まる一言と、次の文。',
      line: '*Let’s give her a break*. We don’t know for sure this is Meredith’s fault.',
      said: '「大目に見てあげよう。Meredith のせいとは限らない」と言う。',
      mean: 'give someone a break ＝ 責めるのをやめる、大目に見る。',
      trap: 'break を「休憩」と取りやすい。次の文が「彼女のせいとは限らない」なので責める話の続き。',
      use: 'Give me a break, it’s my first day.（大目に見てよ、初日なんだから）' },

    // R fix: said held a corrupted character (U+FFFD) where 。 belonged.
    // why: thanks ← her name said first, read as warm; worry ← "Really?" read as concern that Pam might have lice too
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'really', reveals: ['break'], seg: [68.0, 75.3],
      stem: 'What does the reply to Pam’s defense of Meredith show?',
      choices: ['Disbelief that she would defend Meredith', 'Thanks to her for standing up for Meredith',
                'Worry that she might have lice as well'], a: 0,
      cue: '名前を呼んだあとの短い問いと「Come on」。',
      line: '*Pam? Really? Come on.*',
      said: 'かばう Pam に「Pam？本気？よしてよ」と返す。',
      mean: 'Really? と Come on で「そんなわけない」。Meredith ならやりかねない、という前提。',
      trap: '名前を呼ぶと感謝に聞こえやすい。Come on は「勘弁して」の意味。',
      use: 'Oh, come on. You don’t believe that.（よしてよ、本気じゃないでしょ）' },

    // why: coworkers ← "What do you want?" heard as a hostile comeback, so the jab seems aimed at the accusers; stings ←
    //   the put-down is about herself, so hurt seems the natural feeling
    // anchor: 75.2–80.0 s "I know who I am. Nobody's taking Meredith Palmer to the opera…": she names herself, in full,
    //   and owns the image
    // R fix: blind 65 %: the key was the only choice with a feeling, and "Pam, classy" was weak. Now two "Herself"
    //   choices that differ in how it lands ("I know who I am" settles it in words) and the accusers.
    { id: 'c1', skill: 'humor', level: 'C2', point: 'whoiam', seg: [74.7, 80.6],
      stem: 'In Meredith’s answer to all this, who is the joke on?',
      choices: ['Herself, and she is fine with it', 'The coworkers who are blaming her', 'Herself, and it clearly stings'],
      a: 0,
      cue: '自分のことを、名字まで付けて言うところ。',
      line: 'What do you want? *I know who I am*. Nobody’s taking *Meredith Palmer* to the opera…',
      said: 'かばわれて「しょうがない。自分のことは分かってる。私をオペラに連れていく人はいない」と言う。',
      mean: '責められても怒らず、自分の評判を笑いにして認める明るい自虐。',
      trap: 'What do you want? をけんか腰と取ると周りへの皮肉に聞こえる。主語が自分の名前なら的は本人。',
      use: 'I’m no chef, and I know it.（料理人じゃないのは自分でも分かってる）' },

    // why: skipped seat covers ← "Toilet seat covers? Yes" heard as a slip she admits; lice beat anyone ← "none of that is
    //   protection enough" taken on its own
    { id: 'd3', skill: 'detail', level: 'B2', point: 'angela', seg: [95.2, 104.0],
      stem: 'According to Angela, why wasn’t staying clean enough to protect her?',
      choices: ['Meredith is too big a risk', 'She skipped the seat covers once', 'Lice get past anyone’s washing'], a: 0,
      cue: '「Apparently」のあと、最後の短い一文。',
      line: 'Apparently, none of that is protection enough. *Not when it comes to Meredith*.',
      said: '「手は1日6回洗うし、便座カバーも使う。でも Meredith が相手では」。',
      mean: 'when it comes to 〜 ＝「〜が相手だと」。Meredith のせいという言い分。',
      trap: '前の文だけだと一般論に聞こえる。最後の一文で責める相手が決まる。',
      use: 'Not when it comes to my kids.（子どものこととなると話は別）' },

    // R fix: blind 50 %: "wishes he hadn't" was weak, and the seg was 2.9 s. Now "rented one four times so far" (the
    //   number in the wrong relation); the seg starts at "suit wearing" (115.7 s).
    // why: rented today ← "rent" is said, in the wrong relation; four times so far ← "four times" heard as his own
    //   count
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rent', seg: [115.6, 119.4],
      stem: 'What does his remark about renting tell us about him?',
      choices: ['He needs a suit like this quite often', 'He rented this one just for today',
                'He has rented one four times so far'], a: 0,
      cue: '「If you rent」のあと、回数の話。',
      line: 'If you rent *more than four times a year*, it just *makes sense to buy*.',
      said: '防護服について、「年に4回以上借りるなら、買ったほうが得」と言う。',
      mean: 'つまり自分は年に何度も着る人。こんな服が日常的に必要な暮らしだと分かる。',
      trap: 'rent が聞こえるので「借りた」と取りやすい。if で始まる一般論は、自分が買った理由の説明。',
      use: 'At that price, it makes sense to buy.（その値段なら買うのが得）' },

    // why: break room ← the usual place to wait at work; home ← "gather your belongings" heard as being sent home
    { id: 'd4', skill: 'detail', level: 'B1', point: 'warehouse', seg: [129.9, 138.3],
      stem: 'Where does he send the people without lice?',
      choices: ['To the warehouse', 'To the break room', 'Home for the day'], a: 0,
      cue: '持ち物をまとめたあと、どこへ行くか。',
      line: 'gather your belongings, *retreat to the warehouse*, conduct your business there…',
      said: '「持ち物をまとめて倉庫に下がり、駆除が終わるまでそこで仕事を」と指示する。',
      mean: 'retreat ＝ 下がる。軍隊のような言い方で、倉庫に避難させる。',
      trap: '持ち物をまとめると聞くと、帰宅に思える。そのあとの to the 〜 が行き先。',
      use: 'Please gather your belongings and follow me.（荷物をまとめてついてきてください）' },

    // R fix: blind 75 %: "forgot lunch was canceled" was a filler (no cancelled lunch). Now "really asking to be
    //   rescued" ("call me" if you don't hear from me), which "I might want lunch" refutes.
    // why: scared ← "stay here and fight" heard as bravado hiding fear; rescued ← "if you don't hear from me… call me"
    //   heard as the usual call for help
    { id: 'h3', skill: 'humor', level: 'C1', point: 'lunch', seg: [138.9, 144.5],
      stem: 'Why does the last instruction before they leave get a laugh?',
      choices: ['It sounds like a brave last order, but it’s about food', 'It shows he’s too scared to stay behind alone',
                'It sounds brave, but he’s really asking to be rescued'], a: 0,
      cue: '「by lunch」のあと、最後の一文。',
      line: 'If you don’t hear from me by lunch, call me. *I might want lunch*.',
      said: '「残って戦う。昼までに連絡がなければ電話して。昼飯がほしいかも」と言う。',
      mean: '映画なら「助けを呼べ」が来るところで、ただの昼食の注文になる。期待の外し方が笑い。',
      trap: '「残って戦う」で緊張した場面だと思いやすい。最後の一文で、話が急に小さくなる。',
      use: 'Text me when you get there.（着いたらメッセージちょうだい）' },

    // R drop i2: same fact and key as c2 (the "Nothing" is a delay), but its own seg (18.3 s, over 15) can't settle it:
    //   without the aside to camera, "forgotten what it was" stands. c2 covers the point.

    // R fix: blind 85 %: "honest answer" and "angry complaint" were fillers. Now "a cheerful joke" (playful, not
    //   biting), which "What does it look like I'm doing?" refutes. The seg ended inside "Getting" (151.7 s).
    // why: honest ← "Baking a cake" taken at face value; cheerful ← a joke heard as playful, the Japanese 冗談 frame,
    //   not a jab
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'cake', reveals: ['looklike'], seg: [147.5, 152.6],
      stem: 'How does Meredith first answer the question about what she’s doing?',
      choices: ['With a sarcastic joke', 'With an honest answer', 'With a cheerful joke'], a: 0,
      cue: '質問のすぐあと、最初の短い答え。',
      line: '*Baking a cake*. What does it look like I’m doing?',
      said: '「何してるの？」と聞かれ、「ケーキ焼いてる。見て分からない？」と返す。',
      mean: '明らかに違うことを言う皮肉。見れば分かるでしょ、という返し方。',
      trap: '冗談なので明るく聞こえやすい。続く What does it look like…? が皮肉の合図。',
      use: 'Yeah, I’m having the time of my life.（ええ、最高に楽しんでる）' },

    // R fix: seg ended inside "Getting" (151.7 s); now ends after "the lice" (152.6 s).
    { id: 'x1', skill: 'dict', level: 'B2', point: 'looklike', reveals: ['cake'], seg: [149.6, 152.6],
      stem: 'Type Meredith’s reply: “Baking a cake. ___ I’m doing?” (5 words)', answer: 'what does it look like',
      cue: '「Baking a cake」のすぐあと。',
      line: 'Baking a cake. *What does it look like* I’m doing?',
      said: '「見て分からない？」と返す。what does it が「ワダズィッ」と一続き。',
      mean: '見れば分かるでしょ、という皮肉の決まり文句。',
      trap: 'does と it が弱くつながり、語が少なく聞こえる。決まり文句ごと覚える。',
      use: 'What do you think I’m doing?（何してると思う？）' },

    // why: truth ← "Nothing" taken at face value; dropped it ← "now is clearly not the time" heard as giving up
    // anchor: 164.1–173.5 s to camera: "I'm going to tell her, but now is clearly not the time… There's a right way to
    //   do this."
    { id: 'c2', skill: 'infer', level: 'C2', point: 'nothing', seg: [160.4, 174.0],
      stem: 'After the comment to the camera, how should we hear that “Nothing”?',
      choices: ['As a delay: she still means to tell her', 'As the truth: there was nothing to tell',
                'As giving up: she has dropped the idea'], a: 0,
      cue: '答えの場面と、カメラへの一言を比べて。',
      line: 'What were you saying? — Nothing. … *I’m going to tell her*, but *now is clearly not the time*.',
      said: '「何でもない」と答えたあと、カメラに「言うつもり。でも今じゃない」と話す。',
      mean: 'カメラへの本音が直前の Nothing を書きかえる。用がないのでなく、言う時を待っている。',
      trap: 'not the time を「もう言わない」と取りやすい。先に「言うつもり」がある。',
      use: 'I’ll tell him, just not today.（彼には言う。今日じゃないだけ）' },

    // R fix: blind 75 %: "a doctor" was a filler. Now "shaving their heads, like Meredith", which "nobody else needs to
    //   end up bald" refutes; choices now all "By…".
    // why: shampoo ← "lice shampoos" and the store trip are both mentioned; shaving ← Meredith shaves hers, so it
    //   seems to be the plan for all
    { id: 'g2', skill: 'gist', level: 'B2', point: 'remedy', reveals: ['mayo'], seg: [189.0, 254.8],
      stem: 'In the end, how do they plan to treat everyone’s heads?',
      choices: ['By using a home remedy, not chemicals', 'By buying strong lice shampoo',
                'By shaving their heads, like Meredith'], a: 0,
      cue: '頭の話になってから、何を使うかとその理由。',
      line: 'all we need is *mayonnaise*… a really *healthy alternative to the chemicals*…',
      said: '頭はマヨネーズで窒息させればいい、薬品より健康的、という話になり、店へ買いに行く。',
      mean: '薬品のシャンプーでなく、台所の物で対処する。',
      trap: 'shampoo や store、Meredith の坊主頭に引かれやすい。買いに行くのはマヨネーズ。',
      use: 'Is there a natural way to fix this?（自然な方法で治せない？）' },

    // R fix: blind 60 %: the key was the one odd item. "Hair wax" is now "olive oil", a second kitchen remedy.
    // why: lice shampoo ← "lice shampoos" is said a few lines later; olive oil ← "healthy alternative to the chemicals"
    //   fits any kitchen oil
    { id: 'd5', skill: 'detail', level: 'B1', point: 'mayo', reveals: ['remedy'], seg: [192.6, 199.5],
      stem: 'What does someone say is all they need for their heads?',
      choices: ['Mayonnaise', 'Olive oil', 'Lice shampoo'], a: 0,
      cue: '「all we need is」のあと。',
      line: 'No, *all we need is mayonnaise*.',
      said: '「頭はどうするの？」という問いに、「マヨネーズさえあればいい」と答える。',
      mean: 'マヨネーズでシラミを窒息させる、家庭の方法。',
      trap: 'あとで shampoo も出てくるので引かれやすい。all we need is のすぐあとが答え。',
      use: 'All we need is a map.（地図さえあれば大丈夫）' },

    // R fix: blind 80 %: the key was the only joke mechanism. All three now "It takes … to …", each a reading of her
    //   words; "It's horrible" refutes praise.
    // why: real photo ← "picture" taken at face value; praise ← "last longer" heard as wanting the look to stay
    { id: 'h5', skill: 'humor', level: 'C1', point: 'picture', reveals: ['lastlonger'], seg: [220.8, 225.4],
      stem: 'Why is the reply to “Take a picture, it’ll last longer” funny?',
      choices: ['It takes “last longer” to be about her bald look', 'It takes “picture” to be about a real photo',
                'It takes her words as praise for her new look'], a: 0,
      cue: '決まり文句を、返事がどう受け取ったか。',
      line: 'Take a picture, it’ll last longer. — We *don’t want it to last longer*. It’s horrible.',
      said: 'じろじろ見られて「写真でも撮れば？長持ちするよ」と言うと、「長持ちは困る」と返される。',
      mean: '「じろじろ見ないで」の決まり文句を、返事が文字どおりに受けて頭をけなす。',
      trap: '決まり文句を知らないと写真の頼みに聞こえる。同じ言葉が返ったら言葉遊びを疑う。',
      use: 'Take a picture, it’ll last longer!（じろじろ見ないでよ！）' },

    // R fix: blind 80 %: the stem's "It's horrible" picked the negative. Cut from the stem; the seg was 2.9 s, now
    //   from “it'll last longer” (222.0 s).
    // why: want it ← the weak "don't" vanishes before "want"; won't let it ← won't and want are near sounds
    { id: 's1', skill: 'sound', level: 'B2', point: 'lastlonger', seg: [221.9, 225.4],
      stem: 'Fill the gap: “We ___ last longer.”',
      choices: ['don’t want it to', 'want it to', 'won’t let it'], a: 0,
      cue: '「We」のすぐあと、弱く短い音。',
      line: 'We *don’t want it to* last longer. It’s horrible.',
      said: '「長持ちしてほしくない」。don’t の t は消え、want it to がつながる。',
      mean: 'don’t は弱くても、文の意味を決める。',
      trap: 'don’t が短いと want だけに聞こえ、意味が逆になる。It’s horrible と合うか確かめる。',
      use: 'I don’t want it to end.（終わってほしくない）' },

    // R fix: whisper splits "end up bald" and "Not that…" into two turns, so "a hint she didn't mean to give" and "her
    //   instructions" assumed one speaker. All three are now speaker-neutral.
    // why: next step ← it follows a list of instructions; argues ← "Not" at the start heard as contradicting Meredith
    { id: 'm1', skill: 'marker', level: 'B2', point: 'notthat', seg: [234.6, 241.9],
      stem: 'What does the start of the remark to Meredith do?',
      choices: ['Takes back what the last line implied', 'Adds one more step to the instructions',
                'Argues with what Meredith just said'], a: 0,
      cue: '「end up bald」のすぐあと、文頭の二語。',
      line: 'nobody else needs to *end up bald*. — *Not that* it looks bad, Meredith…',
      said: '「もう誰もはげずに済む」の直後、「悪く見えるわけじゃないけど」と足す。',
      mean: 'Not that 〜 ＝「〜というわけじゃないけど」。前の言葉の悪い意味を打ち消す。',
      trap: '文頭の Not を反論と取りやすい。Not that は自分の言葉のフォロー。',
      use: 'Not that I’m complaining, but…（文句じゃないけど…）' },

    // R fix: blind 75 %: the key was the only "each compliment" pattern, and "she" assumed the speaker. Now two
    //   "Each new compliment…" choices and a blame one, none gendered.
    // why: about others ← "a cute baby" heard as a joke about someone else; blames ← "something sucked the life force
    //   out" heard as a dig about the cause
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'repair', reveals: ['fifty', 'notthat'], seg: [239.8, 250.8],
      stem: 'What goes wrong as the speaker tries to make Meredith feel better?',
      choices: ['Each new compliment ends up sounding worse', 'Each new compliment turns into a joke about others',
                'The praise slides into blaming her for the lice'], a: 0,
      cue: '「a cute baby」と、そのあとの「But」。',
      line: 'it looks *awesome*. You look like *a baby who suddenly aged 50 years*… *But something sucked the life force out of it*.',
      said: '「最高に似合う。急に50歳老けた赤ちゃん。かわいい赤ちゃん。でも生気を吸われた」と続ける。',
      mean: 'ほめるほど、たとえがひどくなる。フォローが傷を広げる。',
      trap: 'ひどい言葉は悪口に聞こえやすい。awesome と cute はほめるつもりの印。',
      use: 'I mean that in a good way!（いい意味で言ってるんだよ！）' },

    // why: 15 ← fifteen and fifty differ mainly in stress and the final n; 60 ← the "-ty" is heard, the first part missed
    { id: 'n3', skill: 'number', level: 'B1', point: 'fifty', reveals: ['repair'], seg: [243.9, 248.0], keep: true,
      stem: 'In the comparison to a baby, how many years has it suddenly aged?',
      choices: ['15 years', '50 years', '60 years'], a: 1,
      cue: '「suddenly aged」のすぐあと。',
      line: 'You look like a baby who suddenly aged *50 years*…',
      said: '「急に50歳老けた赤ちゃんみたい」と言う。',
      mean: 'はげた頭を赤ちゃんにたとえ、年寄りの顔も足す。ほめるつもりの比喩。',
      trap: 'fifty と fifteen は似ている。fifty は前を強く、fifteen は後ろの teen を強く長く言う。',
      use: 'I feel like I aged ten years.（10年老けた気分）' },

    // R drop i3: the guilt key rests on lines outside its seg ("I need to tell you", "I'm so sorry", the wig aside)
    //   and on the storyline (what Pam has to tell); "make up for something" was also the only motive-shaped choice.
  ]
};
