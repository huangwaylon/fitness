// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 1
// OPEN: i2, h3 and nt2 all rest on the owner/salesman split; a reader who sees the whole bank gets them at 70–75 %, but
//   a single draw shows far less of it. g1 is ~65 % for anyone who knows Season 8.
// “Scheduling an Appointment with Dwight - The Office US” (the official The Office channel, BEST OF The Office -
// Season 8): Dwight, the new owner of the building, has been cutting costs; when Pam asks him about the cutbacks he
// sends her to his assistant Nate for an appointment, Nate makes up an excuse, and Pam finally makes her case to
// Dwight's face.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 112 s. Pam is named by Dwight (42.3 s,
// 59.3 s, 80.3 s), Stanley by the two lines to him (16 s, 22.2 s), Nate by Pam (59.3 s). Untested on purpose: the
// anus lines (9–15 s), who says "Which is you" (30 s) and "Are you gonna just sit there…" (34 s), Nate's "Yello"
// greeting and "just for one itsy second" (captions "iny", whisper "ain'tsy", 66 s), how Nate says Dwight's name
// (captions "sure truit", whisper "Dwight Truth", 72 s), and whether Dwight keeps his word after the clip ends.
// EAR CHECK: 100.25 s r1 — the cut falls in the pause after "You know what, Pam?", before "You're right"
import type { Clip } from '../types.ts';

export const dwightAppt: Clip = {
  id: 'dwightappt', video: 'AtK9xNpBsCY', title: 'Scheduling an Appointment with Dwight - The Office US', dur: 124, wpm: 145,
  band: 'slow', tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: printer paper / paper towels ← "paper" caught, "toilet" lost before it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'tp', seg: [3.6, 8.3],
      stem: 'What is the first complaint about?',
      choices: ['The paper towels', 'The toilet paper', 'The printer paper'], a: 1,
      cue: '最初の質問の、paper の前の語。',
      line: 'why is the *toilet paper* only half-ply?',
      said: '「トイレットペーパーが半分の薄さなのはなぜ？」とドワイトに聞く。',
      mean: 'ply ＝ 紙の重ね枚数。費用を削った結果、紙まで薄くなった。',
      trap: 'paper だけ拾うと、どの紙か分からない。名詞の前の語まで聞く。',
      use: 'We’re out of toilet paper.（トイレットペーパーが切れてる）' },

    // R fix: V2 (blind 75 %): "planning to sell" was off-scene; now "raising the rent", an owner's move from the same
    //   "new building owner" frame. S4: the segment ended 0.3 s into "cutbacks"; now 42.0.
    // why: rent ← "the new building owner" heard as a landlord squeezing tenants; staff hours ← "cutbacks" heard as cuts
    //   to people
    { id: 'g1', skill: 'gist', level: 'B1', point: 'cuts', reveals: ['tp'], seg: [4, 42.0],
      stem: 'Why are people unhappy with Dwight at the start?',
      choices: ['He’s been cutting back on building costs', 'He’s been raising the rent on the office',
                'He’s been cutting back on staff hours'], a: 0,
      cue: '最初の苦情と、Pam の最後の質問。',
      line: 'why is the *toilet paper* only half-ply? … can we talk about these *cutbacks*?',
      said: 'トイレットペーパーへの苦情から始まり、パムが「削減の話をしたい」と言う。',
      mean: 'ビルの持ち主になったドワイトが、備品や設備の費用を削っている。',
      trap: 'owner から家賃、cutbacks から人減らしと取りやすい。何を削ったかは最初の苦情で確かめる。',
      use: 'Can we talk about the new rules?（新しいルールについて話せる？）' },

    // R fix: V2 (blind 55 %) + N7: "thankful" was the filler; now "embarrassed" (a bathroom topic, the 恥ずかしい
    //   frame). The stem no longer names the toilet paper, which gave d1's key away.
    // why: embarrassed ← a bathroom topic raised in front of everyone, read through 恥ずかしい; amused ← the laugh
    //   after it heard as his
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'business', seg: [15.0, 21.6],
      stem: 'How does Stanley take the suggestion he gets?',
      choices: ['He’s offended by it', 'He’s embarrassed by it', 'He’s amused by it'], a: 0,
      cue: 'Stanley と呼ばれたあとの、短い返事。',
      line: '*Don’t tell me how to do my business*.',
      said: '「多めに引き出せば」と言われ、「やり方を指図するな」と返す。',
      mean: 'Don’t tell me how to 〜 ＝ 口出しするな。はっきりした不快。',
      trap: '話題がトイレなので照れ、笑い声で面白がりと取りやすい。返事が Don’t で始まったら拒否。',
      use: 'Don’t tell me how to drive.（運転に口出ししないで）' },

    // R fix: K1: "treats a toilet break like running a company" was a defensible second key (the double meaning is
    //   exactly that); now "spends work hours in the bathroom". N7: the stem no longer names the toilet paper (d1).
    // why: work hours ← "business" read as 仕事, set in the bathroom talk; none of her concern ← the "mind your own
    //   business" frame, applied to the cuts instead of to how he uses the toilet
    { id: 'h1', skill: 'humor', level: 'C1', point: 'business', seg: [15.0, 21.6],
      stem: 'Why does Stanley’s reply to the suggestion get a laugh?',
      choices: ['It’s also a polite way to say “use the toilet”', 'It hints he spends work hours in the bathroom',
                'It says the cuts are none of her concern'], a: 0,
      cue: '文の最後の語が、この場面でどう聞こえるか。',
      line: 'Don’t tell me how to *do my business*.',
      said: '使い方を提案され、「やり方を指図するな」と返す。',
      mean: 'do one’s business は「用を足す」の遠回し。仕事の話にも聞こえる二重の意味が笑い。',
      trap: 'business を「商売」とだけ取ると笑いが分からない。場面の話題と重ねて聞く。',
      use: 'Mind your own business.（余計なお世話だよ）' },

    // why: argued for supplies ← "I feel for you" heard as having taken their side; Dunder Mifflin ← "fellow Dunder
    //   Mifflin employee" heard as where the cuts come from
    { id: 'i1', skill: 'infer', level: 'B2', point: 'powerless', seg: [22.0, 30.9],
      stem: 'When Dwight says he’s as powerless as Stanley, what is he pretending?',
      choices: ['That the building’s owner is someone else', 'That he already argued for more supplies',
                'That the cuts were ordered by the company'], a: 0,
      cue: 'like you のあとと、すぐあとの短いつっこみ。',
      line: 'like you, I am completely powerless to the whims of the *new building owner*. — *Which is you*.',
      said: '「同情するが、私も持ち主には逆らえない」と言い、「それ、あなたでしょ」と返される。',
      mean: '自分が持ち主なのに、別人のように話して逃げている。',
      trap: 'I feel for you を味方の言葉と取りやすい。直後の Which is you が答え合わせ。',
      use: 'I feel for you, I really do.（気持ちは分かるよ、本当に）' },

    // R fix: B1/N7: the stem quotes "Which is you", which settles i1; reveals `powerless`
    // why: grammar ← "is not a sentence" heard and the rest lost; a denial ← "disagree" caught on its own
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sentence', reveals: ['powerless'], seg: [26.9, 33.95],
      stem: 'How does Dwight’s reply to “Which is you” end up?',
      choices: ['As an admission that he is the owner', 'As a complaint about bad grammar',
                'As a denial that he is the owner'], a: 0,
      cue: '「not a sentence」で終わらず、最後まで聞く。',
      line: '“Which is you” is not a sentence *I disagree with*.',
      said: '「『それ、あなたでしょ』は、私が反対する文ではない」と言う。',
      mean: '文法の文句に聞こえる出だしから、最後で「その通り」に変わる。遠回しに認めている。',
      trap: 'not a sentence で終わると思うと文法の話に聞こえる。英語は最後の語で意味が変わる。',
      use: 'That’s not something I’d argue with.（それには反論しないよ）' },

    // R fix: B1/N7: the stem and line quote "Which is you" (i1); reveals `powerless`
    // why: "a sentence I disagree" ← the grammar instinct drops the stranded "with"; "sentence I agree with" ← the
    //   "dis-" lost after "I"
    // anchor: 31.6–33.3 s "is not a sentence I disagree with" (both sources), four words run together, ending on a
    //   stranded preposition
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'sentence', reveals: ['powerless'], seg: [26.9, 33.95],
      stem: 'Type the end: “‘Which is you’ is not a ___.” (4 words)', answer: 'sentence i disagree with',
      cue: 'not a のあと、最後の小さな語まで。',
      line: '“Which is you” is not a *sentence I disagree with*.',
      said: '「『あなたでしょ』は、私が反対する文ではない」。最後の4語が一息で、with は弱く短い。',
      mean: '文の最後に with が残る形は会話でふつう。with がないと意味が通らない。',
      trap: '最後の前置詞は弱く、聞き落としやすい。文が「〜を」で終わるはずの所は、最後の小さな語まで書く。',
      use: 'That’s a plan I can live with.（それなら受け入れられる）' },

    // R fix: V2 (blind 70 %): "talk to him at his desk later" was the filler; now "salespeople aren't allowed", a rule
    //   read into "when I'm sitting at this desk"
    // why: busy with sales ← "I'm a salesman" heard as an excuse about time; not allowed ← the desk heard as a work rule
    //   someone else set, not a role he puts on
    { id: 'i2', skill: 'infer', level: 'C1', point: 'desk', seg: [41.9, 49.25],
      stem: 'What does Dwight mean by “when I’m sitting at this desk”?',
      choices: ['Here he’s only a salesman, not the owner', 'He’s too busy making sales to talk now',
                'Salespeople aren’t allowed to discuss it'], a: 0,
      cue: 'desk の文のあと、If で始まる文。',
      line: 'when I’m sitting at this desk, *I’m a salesman*. If you want to talk to the *new building owner*…',
      said: '「この席では営業マンだ。持ち主と話したいならネイトに予約を」と言う。',
      mean: '座る場所で役割を分けてみせる。持ち主としての話は、ここでは受けない。',
      trap: 'desk を忙しさや職場の決まりと取りやすい。If 以下で、自分の持ち主の役を別人扱いしている。',
      use: 'At work, I’m not your brother.（職場では兄弟じゃない）' },

    // why: reluctant yes ← the Japanese frame: a junior answers "I'll try" (検討します), not a flat no; asks for the
    //   number ← "call Nate" heard as the next step she takes
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'refuse', seg: [42.2, 50.6],
      stem: 'How does Pam first respond to being told to make an appointment?',
      choices: ['She flatly refuses', 'She reluctantly agrees', 'She asks how to reach Nate'], a: 0,
      cue: 'appointment のすぐあと、Pam の短い一文。',
      line: '*I’m not going to do that*.',
      said: '「ネイトに予約を」と言われ、「そんなことしない」と即答する。',
      mean: 'I’m not going to do that ＝ きっぱりした拒否。「する気はない」。',
      trap: '日本語の「検討します」のような含みはない。not going to はそのまま「しない」。',
      use: 'I’m not going to do that.（それはしないよ）' },

    // R fix: V2 (blind 75 %): "never met the owner" and "the owner is strict" clashed with the scene; now "repeats what
    //   Nate told him" (I hear, literally) and "teases Pam for not knowing" (the joke aimed at the wrong person)
    // why: Nate ← "I hear" read literally, with Nate just named as the go-between; teases Pam ← the joke put on her
    //   instead of on himself
    { id: 'h3', skill: 'humor', level: 'C1', point: 'reasonable', seg: [50.5, 58.2],
      stem: 'Why is Dwight’s last remark about the building owner funny?',
      choices: ['He praises himself as if talking about a stranger', 'He repeats what Nate has told him about the owner',
                'He teases Pam for not knowing who the owner is'], a: 0,
      cue: 'I hear のあと、誰のことを話しているか。',
      line: 'which is a shame, because *I hear he’s a very reasonable guy*.',
      said: '「それは惜しい。うわさでは、とても話の分かる人らしいよ」と言う。',
      mean: '持ち主は自分なのに、他人のうわさのように自分をほめている。',
      trap: 'I hear を文字どおり「聞いた話」と取ると、別人の話に聞こえる。話し手と話題の人が同じか確かめる。',
      use: 'I hear the new place is great.（新しい店、いいらしいよ）' },

    // R fix: S2: the stem's quote dropped a word ("itsy", garbled in both sources) without marking it; now "one… second"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'hold', seg: [64.1, 67.3],
      stem: 'Type what Nate says: “___ just for one… second.” (6 words)', answer: 'let me put you on hold',
      cue: '電話の相手に、少し待たせる時の決まり文句。',
      line: '*Let me put you on hold* just for one… second.',
      said: '「少し保留にさせて」。let me が「レミ」、put you が「プチュ」に。',
      mean: 'put 人 on hold ＝ 電話を保留にする。電話の決まり文句。',
      trap: 'let me と put you がつながり、語の数が分かりにくい。決まり文句ごと聞く。',
      use: 'Can I put you on hold?（保留にしてもいいですか）' },

    // why: him I'm ← "her" reduced to "er" and heard as "him"; her I was ← "I'm" heard as the past; them I'm ← the weak
    //   vowel of "her" heard as "them"
    { id: 's1', skill: 'sound', level: 'B2', point: 'tellher', seg: [73.2, 77.1],
      stem: 'Fill the gap: “Tell ___ busy.”',
      choices: ['him I’m', 'her I’m', 'her I was', 'them I’m'], a: 1,
      cue: 'Tell のすぐあと、h が消えてつながる所。',
      line: '*Tell her I’m* busy.',
      said: '「忙しいと言っておいて」とネイトに頼む。tell her が「テラー」に聞こえる。',
      mean: 'her の h は弱く消え、前の語とつながる。tell her ＝「テラ」。',
      trap: 'h が消えると him か her か迷う。電話の相手が誰かを思い出して聞く。',
      use: 'Tell her I’ll call back.（折り返すと伝えて）' },

    // R fix: V2 (blind 65 %): "a joke he and Pam often share" was the filler; now "the real reason" and "a cover story
    //   Dwight had planned", a near miss that "Make something up" settles
    // why: real reason ← Nate's message taken at face value; planned ← an excuse, but Dwight's, worked out beforehand
    { id: 'i3', skill: 'infer', level: 'B2', point: 'excuse', reveals: ['tellher'], seg: [74.6, 87.4],
      stem: 'What should we make of the reason Nate gives Pam?',
      choices: ['It’s an excuse Nate made up on the spot', 'It’s the real reason Dwight can’t come',
                'It’s a cover story Dwight had planned'], a: 0,
      cue: 'Tell her I’m busy のあとの、もう一言。',
      line: 'Tell her I’m busy. I don’t know. *Make something up*.',
      said: 'ドワイトは「忙しいと言え。適当に作れ」と言い、ネイトがその理由をパムに伝える。',
      mean: 'その場で作った言い訳。中身が大げさなのは、急に考えたから。',
      trap: '伝言を本当の話や用意した話と取りやすい。直前の Make something up が答え合わせ。',
      use: 'Just make something up.（適当に言っといて）' },

    // why: looking for a dog ← "dog" caught, "questioned" lost; reporting a theft ← "police" and "dognappings" caught
    //   but the relation reversed (a victim, not a suspect)
    { id: 'd2', skill: 'detail', level: 'B2', point: 'police', seg: [79.5, 87.4],
      stem: 'According to Nate, why can’t Dwight meet Pam?',
      choices: ['He’s being questioned by the police', 'He’s out looking for his lost dog',
                'He’s telling police his dog was stolen'], a: 0,
      cue: 'Pam と呼んだあと、police の前の動詞。',
      line: 'Dwight’s *being questioned by the police* in connection with…',
      said: '「ドワイトは連続犬泥棒の件で取り調べ中」と言う。',
      mean: 'be questioned ＝ 取り調べを受ける。疑われている側の話。',
      trap: 'dog と police だけ拾うと被害者の話に聞こえる。受け身の being questioned を聞く。',
      use: 'He’s in a meeting right now.（今、会議中です）' },

    // R fix: V2 + S1: the stem's plural "dognappings" gave the key; the stem now says "the crime"
    // why: a single one ← "a string of" lost, so one big case is assumed; a cut leash ← string = ひも, read literally
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'string', reveals: ['police'], seg: [79.5, 87.4],
      stem: 'What does Nate’s excuse say about the crime?',
      choices: ['It’s one of several in a row', 'It’s a single, very big case', 'It involved a dog’s leash being cut'], a: 0,
      cue: 'in connection with のあと、dog の前。',
      line: 'questioned by the police in connection with *a string of* dognappings',
      said: '「連続犬泥棒の件で取り調べ中」と言う。',
      mean: 'a string of ＝ 続けて起きた一連の〜。事件や失敗などに使う。',
      trap: 'string を「ひも」と取ると犬のひもに結びつく。a string of で「立て続け」と覚える。',
      use: 'We’ve had a string of bad days.（悪い日が続いてる）' },

    // R fix: V2 (blind 60 %) + K5: "rather not face the owner" was refuted by her facing him, and the choices mixed "To…"
    //   and "Because…"; now "make the complaint less personal" (the Japanese 遠回し frame), all "To…"
    // why: real messenger ← Pam taken at her word, as if Dwight could pass it on; less personal ← indirect speech read as
    //   softening (遠回し), though she ends on "His friends"
    // anchor: 30 s "Which is you" and 46 s "if you want to talk to the new building owner… call Nate" set up the two-role
    //   game; 88.4–97.9 s Pam turns to Dwight himself and asks him to "tell the new building owner"
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'gobetween', seg: [88.0, 98.4],
      stem: 'Why does Pam ask Dwight to “tell the new building owner” something?',
      choices: ['To turn his own game back on him, face to face', 'To have him pass the message on to the owner',
                'To make the complaint sound less personal'], a: 0,
      cue: '誰に向かって話しているかと、伝言の相手。',
      line: 'Dwight, can you please *tell the new building owner* that he is screwing over…',
      said: 'ネイトの言い訳を聞いたあと、隣のドワイトに「新しい持ち主に伝えて」と頼む形で不満を言う。',
      mean: '持ち主はドワイト本人。彼の「役割分け」の芝居に乗ったふりで、本人に直接ぶつけている。伝言は形だけ。',
      trap: '言葉どおり伝言の依頼と取りやすい。頼む相手と伝える相手が同じ人なら、それは皮肉な乗っかり。',
      use: 'Could you tell my boss I’m leaving early?（上司に早退すると伝えてくれる？）' },

    // R fix: V2 (blind 50 %): "fixing things up" was the only kind choice in a complaint; now "putting pressure on
    //   them" (putting the screws on)
    // why: pressure ← "screw" read as ねじを締める, 締めつける; watching ← a near guess for a boss's verb
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'screw', seg: [88.0, 98.4],
      stem: 'What does Pam say the owner is doing to the people he works with?',
      choices: ['Treating them unfairly', 'Putting pressure on them', 'Watching them too closely'], a: 0,
      cue: 'he is のあとの、動詞と over。',
      line: 'he is *screwing over* all the people he works with',
      said: '「一緒に働く人たちをひどい目にあわせている」と言う。',
      mean: 'screw over ＝ 人に損をさせる、ずるく扱う。くだけた言い方なので場面を選ぶ。',
      trap: 'screw を「ねじを締める」と取ると、圧力の意味に聞こえる。over が付くと人に損をさせる意味。',
      use: 'The airline really screwed us over.（航空会社にひどい目にあわされた）' },

    // R fix: V2 (blind 55 %): "the savings matter more" was refuted by the stem's own frame; now "discuss it later", the
    //   検討します close
    // why: back to Nate ← the earlier "call Nate" heard as where it ends; later ← a polite non-answer expected (検討します)
    { id: 'g2', skill: 'gist', level: 'B1', point: 'end', reveals: ['youknow'], seg: [88.0, 112.5],
      stem: 'Where does Pam’s appeal leave things by the end of the clip?',
      choices: ['Dwight says that she is right', 'Dwight sends her back to Nate', 'Dwight agrees to discuss it later'], a: 0,
      cue: 'You know what のあとの一言。',
      line: 'You know what, Pam? *You’re right*. This isn’t just a business.',
      said: 'パムが直接訴えると、ドワイトは「君の言う通り。ただの会社じゃない」と答える。',
      mean: 'ドワイトが、言葉の上ではパムに同意して終わる。',
      trap: '前の断り方から、また Nate へ、または「あとで」と取りやすい。You know what のあとで決まる。',
      use: 'You’re right. I hadn’t thought of that.（その通り。考えてなかった）' },

    // R fix: V2 (blind 65 %) + K5: the key was the only "appeal" choice; now three things she could do to what she said
    // why: correcting ← the Japanese frame: 言い直し, as if the first words were wrong; softening ← the follow-ups heard
    //   as taking the edge off "screwing over"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'friends', reveals: ['screw'], seg: [92.5, 98.5],
      stem: 'What is Pam doing as she adds two short phrases at the end?',
      choices: ['Making what she said hit harder', 'Correcting what she said at first',
                'Softening what she said at first'], a: 0,
      cue: 'people のあとに足される2つ。',
      line: 'all the people he works with. People he’s worked with *for years*. *His friends*.',
      said: '「一緒に働く人たち。何年も一緒の人たち。友達よ」と言葉を重ねる。',
      mean: '同じ人たちを、だんだん近い関係で言い直して気持ちに訴える。強調の重ね方。',
      trap: '言い直しを訂正や和らげと取りやすい。同じ人をより近い言葉で重ねたら、強調のサイン。',
      use: 'It’s my team. My people. My friends.（私のチーム、仲間、友達なの）' },

    // predict: the segment stops after "You know what, Pam?"; the reveal plays "You're right. This isn't just a business…"
    // R fix: V2 (blind 60 %): "a recap" was weak; now "a telling-off", the usual script after "You know what, <name>?"
    // why: a real question ← "you know what?" read as asking if she knows something; telling-off ← the script this
    //   scene breaks: a name plus "you know what" often opens a snap
    { id: 'r1', skill: 'predict', level: 'B2', point: 'youknow', seg: [96.75, 100.25], then: [100.25, 106.7],
      stem: 'Right after “You know what, Pam?”, what kind of move comes next?',
      choices: ['A conclusion he has just reached', 'A real question for her to answer', 'A sharp telling-off for her tone'], a: 0,
      cue: '名前で呼んだあと、少し間がある。',
      line: '*You know what*, Pam? You’re right.',
      said: 'パムの訴えのあと「なあパム」と呼び、間を置いて「君の言う通りだ」と言う。',
      mean: 'You know what? は質問ではなく、考えや結論を言う前の前置き。',
      trap: '疑問文の形から質問、名前の呼びかけからお説教と取りやすい。このあとには、出した結論が来る。',
      use: 'You know what? Let’s just go.（もういいや、行こう）' },

    // why: dozens ← a small amount guessed for "plumbing and electricity"; thousands ← "-dreds" heard as "-sands" with
    //   the vowel lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'hundreds', seg: [106.6, 112.5],
      stem: 'How much does Dwight mention saving on plumbing and electricity?',
      choices: ['Dozens', 'Hundreds', 'Thousands'], a: 1, keep: true,
      cue: 'save のすぐあとの数の語。',
      line: 'than save *hundreds* on plumbing and electricity.',
      said: '「水道や電気で何百ドルも浮かせるより」と言う。',
      mean: 'hundreds ＝ 何百（ドル）。具体的な額を言わない言い方。',
      trap: 'hundreds と thousands は語末が似ている。最初の音 h か th かで決める。',
      use: 'It saves us hundreds a year.（年に何百ドルも浮く）' },

    // why: thanks from Pam ← she made the plea, so her thanks sounds like the prize; a home ← "this is a home" said just
    //   before, heard as the thing he wants
    { id: 'd3', skill: 'detail', level: 'B2', point: 'kevin', reveals: ['hundreds'], seg: [106.6, 112.5],
      stem: 'What does Dwight say he’d prefer to the savings?',
      choices: ['A smile from Kevin', 'A thank-you from Pam', 'A real home for all'], a: 0,
      cue: 'much rather のあと、than の前。',
      line: 'I would *much rather see a smile from Kevin* than…',
      said: '「何百ドル浮かせるより、ケビンの笑顔が見たい」と言う。',
      mean: 'would rather A than B ＝ B より A がいい。A が先、B があと。',
      trap: 'than の前と後を逆に取りやすい。rather のすぐあとが選んだ方。',
      use: 'I’d rather walk than wait.（待つより歩きたい）' },
  ]
};
