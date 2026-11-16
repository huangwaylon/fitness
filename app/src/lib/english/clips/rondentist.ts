// REVIEW 2026-11-16: pass 5, fix 18, drop 0, new 0; ear checks 1
// “Andy and Ron at the Dentist | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Ron
// volunteers to survey the concert grounds alone, which Leslie takes as him loving government work; to the camera, the
// new father says he misses silence. Leslie sends Andy along; Andy hurts his mouth, and Ron, at the dentist's, ends up
// fielding Andy's questions like a parent.
// Segments from the captions, words from whisper (2026-11-16). The captions put "pictures" at 154.8 s; whisper's
// 147.5–149.8 s is used for h4.
// Untested on purpose: 61 s ("I just faced you suckers": unclear), 80–82 s (whisper "his robots", captions "this is
// robots"), 106–110 s ("five-second rule": what fell is only seen), 132–138 s ("Oh, Ron. What a mess. Here, let me help
// you": the speaker is unclear).
// EAR CHECK: 118.9 s r1 — the cut falls after "head back to the park" and before Andy's "Hey, wait, wait…" (whisper
// starts it at 119.06 s; the captions miss it and start at 120.1 s with "liquid")
import type { Clip } from '../types.ts';

export const ronDentist: Clip = {
  id: 'rondentist', video: 'Lgfqhhf-WSk', title: 'Andy and Ron at the Dentist | Parks and Recreation', dur: 170,
  wpm: 150, band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): "good company" was the plain opposite of the key. Now "with the surveyors", the people
    //   Leslie names just before, in the same frame as the key; key lengthened for K7.
    // why: enjoys work ← Leslie's own reading ("love government work"), and he does say "Yes"; surveyors ← Leslie
    //   says she will meet "the surveyors", and he volunteers for the survey, so "alone" is easy to lose
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reason', seg: [10.0, 28.4],
      stem: 'What is Ron’s real reason for offering to do the survey?',
      choices: ['A whole day out all on his own', 'A new liking for this kind of work',
                'A whole day out with the surveyors'], a: 0,
      cue: '「Yes」のあと、彼が続ける一文。',
      line: 'Spending the day *outside alone* sounds like a dream.',
      said: '公園の測量を自分でやると申し出て、「外で一人で一日過ごすなんて夢のようだ」と言う。',
      mean: '仕事が好きになったのではなく、一人になれるのが目当て。',
      trap: '上司の「仕事が好きになった」という読みに引っぱられやすい。本人の次の一文が本音。',
      use: 'A quiet day alone sounds like a dream.（一人で静かな一日、最高だね）' },

    // R fix: V2 (blind 55 %): only the key was a life aim. All three are now "Finally…" aims.
    // why: get through a day ← get through = 乗り切る, and "a day" is said just before; outdoors ← he has just
    //   offered to spend the day outside, so a partial listener hears her wish as getting him out
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'through', reveals: ['reason'], seg: [13.2, 21.7],
      stem: 'What does Leslie say she always knew she would one day do?',
      choices: ['Finally win him over', 'Finally get him outdoors',
                'Finally get through a day with him'], a: 0,
      cue: '「a day when I would」のあとの動詞と、続く and。',
      line: 'I always knew there would be a day when I would *get through to you*, and you would love government work.',
      said: '「いつか分かってもらえる日が来ると思ってた。行政の仕事を好きになるって」と言う。',
      mean: 'get through to 人 ＝ 相手の心に届く。説得が実ったという喜び。',
      trap: '「乗り切る」とも取れるが、to＋人なら「心に届く」。to の有無を聞く。',
      use: 'I finally got through to him.（やっと彼に分かってもらえた）' },

    // R fix: V2 (blind 60 %): "Bitter" was a weak filler. Now "Stiff; shy about her praise" (the 照れ frame), and the
    //   key no longer says "without meaning it" outright.
    // why: warm ← he does say "Yes" to her praise; shy ← a flat, short reply to praise read as Japanese 照れ
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'yes', reveals: ['reason'], seg: [17.7, 28.4],
      stem: 'How does Ron’s answer to Leslie’s “historic day” come across?',
      choices: ['Dry; he goes along with her reading', 'Warm; he admits she has won him over',
                'Stiff; he is shy about her praise'], a: 0,
      cue: '「Yes」の直後に、何を理由に挙げるか。',
      line: '*Yes, that is what has happened.* Spending the day outside alone sounds like a dream.',
      said: '「ええ、そういうことです」と認め、すぐ「外で一人で一日、夢のようだ」と続ける。',
      mean: '口では同意し、次の文で別の理由を平然と言う。上司の読みは外れている。',
      trap: 'Yes だけで本気の同意と取りやすい。次の一文が、言葉の中身を打ち消している。',
      use: 'Sure, let’s go with that.（はいはい、そういうことにしておこう）' },

    // R fix: V2 (blind 55 %): the distractors are now new-father wishes in the key's frame (sleep; his own TV).
    // why: sleep ← the usual new-parent complaint, the script this line breaks; his own TV ← "TV program" is said
    { id: 'd1', skill: 'detail', level: 'B1', point: 'miss', seg: [28.2, 42.4],
      stem: 'In his comment to the camera, what does the new father miss?',
      choices: ['Silence, even for one moment', 'Sleep, even for one full night',
                'His own TV, even for one hour'], a: 0,
      cue: '「a few things I miss」のすぐあとの一語。',
      line: 'there are a few things I miss. *Silence*, the absence of noise.',
      said: '「父親は好きだが、恋しいものもある。静けさだ」と言う。',
      mean: 'the absence of noise は silence の言いかえ。それほどほしいという強調。',
      trap: 'TV program が聞こえて「テレビが見たい」と取りやすい。番組は静けさを奪う側。',
      use: 'I just need some peace and quiet.（ちょっと静かにしていたいだけ）' },

    // R fix: V2 (blind 65 %): "hardly any TV" was the plain opposite. Now a crying baby (noise, but not the show).
    // why: crying ← "no quiet" and "noise" heard as a baby's noise; likes the show ← the name repeated read as fondness
    { id: 'i2', skill: 'infer', level: 'B2', point: 'mcstuffins', seg: [35.3, 48.6],
      stem: 'From the end of his comment, what is it like at home now?',
      choices: ['One kids’ show seems to be on all the time', 'The baby seems to cry all through the show',
                'He seems to have come to like the kids’ show'], a: 0,
      cue: '最後の二文、「There is」で始まる言い方の対比。',
      line: 'There is no quiet anymore. There is *only Doc McStuffins*.',
      said: '子ども番組の名前を挙げ、「もう静けさはない。あるのはその番組だけ」と言う。',
      mean: 'only は大げさな言い方。家ではずっとその番組が流れている。',
      trap: '名前のくり返しは好きなように聞こえる。no quiet と並ぶ only は嘆きの合図。',
      use: 'There’s no quiet in this house.（この家には静けさってものがない）' },

    // R fix: V2 (blind 70 %): only the key named a speech act. All three now pair a kind of line with its content;
    //   "a free choice" is the Japanese reading of a suggestion as optional.
    // why: real question ← "why don't you" read literally as asking a reason; free choice ← 「〜したら？」 heard as
    //   leaving it up to him, though a boss is assigning the task
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'whydont', seg: [49.0, 52.4],
      stem: 'When Andy is told to go with Ron, what kind of line is it?',
      choices: ['A polite order: go and help Ron', 'A free choice: help Ron if he likes',
                'A real question: why not help Ron?'], a: 0,
      cue: '名前を呼んだあとの「Why」で始まる問いの形。',
      line: 'Andy, *why don’t you* go with Ron and help him?',
      said: '「アンディ、ロンと一緒に行って手伝ってあげたら？」と言う。',
      mean: 'why don’t you ＝「〜したら？」。上司が言えば、やわらかい形の指示。',
      trap: 'why を「なぜ」と取ると理由を聞く質問に聞こえる。求められているのは行動。',
      use: 'Why don’t you take a break?（ちょっと休んだら？）' },

    // R fix: V2 (blind 70 %) + B1: "back at the office helping Leslie" was weak. The distractors are now his "head back
    //   to the park" (as if it happened) and the dentist with the wrong patient. The key says he stays, so it reveals
    //   r1's `quick`.
    // why: drops Andy and goes back ← he does say he'll head back to the park; hurt mouth ← "dentist" and "my mouth"
    //   said, the wrong man
    { id: 'g2', skill: 'gist', level: 'C1', point: 'day', reveals: ['reason', 'parent', 'mouth', 'quick'], seg: [49.0, 150.4],
      stem: 'How does Ron’s day turn out, compared with his plan?',
      choices: ['He ends up minding Andy at the dentist', 'He drops Andy at the dentist and goes back',
                'He ends up at the dentist with a hurt mouth'], a: 0,
      cue: 'アンディの質問が続くことと、ロンの最後の嘆き。',
      said: '一人の一日のはずが、アンディが口をけがし、歯医者で次々に質問されて付き添う。',
      mean: '静けさを求めて逃げた先で、もう一人の「子ども」の世話。計画と正反対。',
      trap: '公園に戻ると言った所で終わったと思いやすいが、アンディに引き止められている。',
      use: 'So much for a quiet day.（静かな一日のはずが、台なしだ）' },

    // R fix: V2 (blind 50 %): "Any help" fitted "don't need" best on its own. All three now name something from Andy
    //   in the same short frame.
    // why: a ride ← cars and "shotgun" come right after; the front seat ← Andy's "shotgun" cuts in on the same breath
    { id: 'i1', skill: 'infer', level: 'B2', point: 'needhelp', reveals: ['whydont'], seg: [49.6, 54.6],
      stem: 'When Ron starts “I really don’t need—”, what is he about to refuse?',
      choices: ['Help from Andy', 'A ride with Andy', 'The front seat'], a: 0,
      cue: '直前に上司が言った最後の語。',
      line: 'why don’t you go with Ron and *help him*? — I really don’t need—',
      said: '「ロンを手伝って」と言われ、ロンが「いや、別に要らな…」と言いかける。',
      mean: '言いかけた need の目的語は、直前の help。手伝いを断りかけている。',
      trap: 'すぐあとの shotgun（車の席）に引っぱられやすい。言いかけは直前の話への答え。',
      use: 'Thanks, but I really don’t need help.（ありがとう、でも手伝いは本当に大丈夫）' },

    // R fix: V2 (blind 60 %): "the whole back seat" was a filler. Now "the right to choose the music", the other perk
    //   of riding up front.
    // why: drive ← he claims a seat "in any car", read as wanting to drive; music ← the front passenger's usual perk,
    //   which he never mentions
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'shotgun', seg: [53.0, 60.2],
      stem: 'What does Andy claim the moment he hears he is going?',
      choices: ['The seat next to the driver', 'The right to drive the car', 'The right to choose the music'], a: 0,
      cue: 'くり返し叫ぶ一語と、in any car。',
      line: '*Shotgun!* I call shotgun… for the rest of my life. In any car!',
      said: '「助手席はおれ！今日一日、いや一生、どの車でも」と叫ぶ。',
      mean: 'call shotgun ＝ 助手席を先に取る宣言。友だち同士でよく言う。',
      trap: 'shotgun を「銃」と取ると意味が通らない。車の話で叫んだら席の取り合い。',
      use: 'Shotgun! I’m sitting up front.（助手席もらった！前に座るね）' },

    // R fix: V2 (blind 55 %): the key was the only positive feeling. Now two positive and one anxious, told apart by
    //   what they are about.
    // why: picked ← the boss chose him, so pride is a natural reading; nervous ← "Where are we going?" heard as worry
    //   about the job
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'excited', reveals: ['shotgun'], seg: [53.0, 65.2],
      stem: 'How does Andy feel about being sent off with Ron?',
      choices: ['Thrilled, mostly about the ride', 'Proud, mostly about being chosen',
                'Nervous, mostly about the job'], a: 0,
      cue: '行き先を聞いたあとの自分の答えと、笑い声。',
      line: 'Where are we going? *Doesn’t matter.* … *Ha ha!*',
      said: '「どこ行くの？どこでもいい！」と笑い、「駐車場で待ってる」と叫ぶ。',
      mean: '行き先はどうでもよく、席を取れて大喜び。子どものようなはしゃぎ方。',
      trap: '行き先を聞くので不安と取りやすいが、自分で Doesn’t matter と答えている。',
      use: 'Where are we going? Doesn’t matter, I’m in!（どこ行くの？どこでもいい、行く！）' },

    // R fix: V2 (blind 55 %): all three now share "a man behind the wall" and differ only in the verb the item turns on.
    // why: watches ← "a guy standing behind the wall" read as a guard; takes cards ← "slides… in there" with the wrong
    //   thing going in
    { id: 'd2', skill: 'detail', level: 'B1', point: 'atm', seg: [66.8, 80.1],
      stem: 'What does Andy want to know about the ATM?',
      choices: ['If a man behind the wall feeds the bills in', 'If a man behind the wall watches the line',
                'If a man behind the wall takes the cards in'], a: 0,
      cue: '「behind the wall」のあとの動詞。',
      line: 'is there an actual guy standing behind the wall who *slides dollar bills in* there?',
      said: '「ATMの壁の後ろに本当に人がいて、お札を差し入れてるの？」と聞く。',
      mean: 'slide in ＝ すべらせて入れる。人が手でお札を入れていると思っている。',
      trap: '壁の後ろの人を見張り役と取りやすい。who のあとの動詞が、その人の役目。',
      use: 'Is there a real person behind this?（これ、裏に本当に人がいるの？）' },

    // anchor: 69.28–71.2 s three weak words squeezed into ~0.4 s (69.92–70.32) between "ask you" and "important"; both
    //   sources have "kind of an"
    { id: 'c1', skill: 'dict', level: 'C2', point: 'kindofan', seg: [68.8, 71.5], retired: true,
      stem: 'Type the words: “Can I ask you ___ important question?” (3 words)', answer: 'kind of an',
      cue: '「ask you」と「important」の間、つぶれた短い音。',
      line: 'Can I ask you *kind of an* important question?',
      said: '「ちょっと大事な質問していい？」と聞く。三語が一息で「カイナヴン」に近い。',
      mean: 'kind of ＝「ちょっと」とぼかす語。母音の前なので an が付き、of と an がつながる。',
      trap: 'kind of a や a kind of と、習った形に直したくなる。弱い音ほど聞こえた順に書く。',
      use: 'It’s kind of an emergency.（ちょっと急ぎなんだ）' },

    // R fix: K1 + V2 (blind 65 %): "owns up that his first question was a joke" was defensible ("I do have a serious
    //   question" implies it). Now a follow-up about ATMs, the expected script.
    // why: corrects Ron ← actually = 実は, heard as setting him straight; ATM ← the usual follow-up after a "No"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [79.8, 86.8],
      stem: 'After Ron’s one-word answer, how does Andy move on?',
      choices: ['He moves on to a new, weightier question', 'He asks Ron how the ATM really works',
                'He goes back and corrects Ron’s answer'], a: 0,
      cue: 'Oh のあとの二、三語と、そのあと何を出すか。',
      line: 'Oh, *actually, you know what?* I do have a serious question.',
      said: '「あ、そうだ、ちゃんとした質問があった」と別の話を出す。',
      mean: 'actually, you know what? ＝「あ、そういえば」。思いついた話に切りかえる合図。',
      trap: '「実は」と訳すと打ち明けや訂正に聞こえる。ここは話題を変える前置き。',
      use: 'Actually, you know what? I’ll have the soup.（あ、やっぱりスープにします）' },

    // R fix: V1: "a film alien" needed world knowledge (that Predator is an alien). The key now says only what he says:
    //   it's about a movie. (Blind 40 %, so V2 passed.)
    // why: ATM again ← both are his "important" questions; the survey ← mud and "seeing you" heard as about their job
    { id: 'h2', skill: 'humor', level: 'C1', point: 'serious', reveals: ['actually'], seg: [82.8, 94.6],
      stem: 'Why is Andy’s “serious question” funny?',
      choices: ['It is a question about a movie', 'It is the ATM question all over again',
                'It is about hiding mud on the survey'], a: 0,
      cue: '「In the」のあとの話の中身。',
      line: 'I do have a *serious question*. In the movie *Predator*, can you rub any kind of mud on yourself…',
      said: '「真面目な質問」と言って、映画『プレデター』で泥を塗れば見つからないかと聞く。',
      mean: '真面目と前置きして、映画の怪物の話。前置きと中身の落差が笑い。',
      trap: 'mud で仕事の話と取りやすいが、in the movie と言っている。前置きと中身を比べる。',
      use: 'Okay, serious question: pizza or tacos?（真面目な質問：ピザとタコス、どっち？）' },

    // R fix: V2 (blind 60 %): the key was the only classic punchline shape. All three now turn on the order of "fine"
    //   and the hurt.
    // why: asks Ron ← "Are you hurt?" heard as Andy asking; sucks then fine ← "That sucks" is said, but before the
    //   question, not after "fine"
    { id: 'h1', skill: 'humor', level: 'B2', point: 'mouth', seg: [94.2, 104.4],
      stem: 'Why is Andy’s answer to “Are you hurt?” funny?',
      choices: ['He says he is fine, then finds a part that isn’t', 'He says he is fine, then asks if Ron is hurt',
                'He says it sucks, then that he is fine'], a: 0,
      cue: '「All good」をくり返したあとの一言。',
      line: 'Oh, no. *All good. All good.* Oops, *except for my mouth*.',
      said: '「ううん、大丈夫、大丈夫。…あ、口以外は」と言う。',
      mean: '大丈夫と言い切ってから、肝心な所のけがに気づく。その落差が笑い。',
      trap: '最初の Ow! で「痛い」の話と取りやすい。except for のあとで答えがひっくり返る。',
      use: 'All good, except for my phone.（全部大丈夫、スマホ以外は）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fitin', seg: [113.3, 116.8],
      stem: 'Type the words: “She’ll ___ as soon as there’s an opening.” (3 words)', answer: 'fit you in',
      cue: '「she’ll」のすぐあと、短い三語がつながる所。',
      line: 'The receptionist says she’ll *fit you in* as soon as there’s an opening.',
      said: '「空きが出たらすぐ入れてくれるって」と伝える。fit you は「フィッチュ」。',
      mean: 'fit 人 in ＝ 予定に人を入れる。予約なしで見てもらうときの決まり文句。',
      trap: 't と you がつながり「チュ」になる。動詞＋人＋in の形で覚える。',
      use: 'Could you fit me in today?（今日、予約入れてもらえますか）' },

    // predict: the segment stops after "head back to the park"; the reveal plays Andy's reply
    // R fix: V2 (blind 60 %): "thanks and says goodbye" was the only non-answer to the "if". Now "says he is fine", the
    //   literal answer to "If you're all right".
    // why: fine ← the literal answer to "If you're all right"; asks to come ← "back to the park" heard as an invitation
    { id: 'r1', skill: 'predict', level: 'B2', point: 'quick', seg: [113.3, 118.9], then: [118.9, 127.0],
      stem: 'Right after Ron says he’ll head back to the park, what kind of move comes?',
      choices: ['Andy stops him with urgent questions', 'Andy tells him he is fine and to go',
                'Andy asks to come back to the park too'], a: 0,
      cue: '「If you’re all right」の if に注目。',
      line: 'If you’re all right, I’m gonna head back to the park. — Hey, *wait, wait, wait*, quick, quick…',
      said: '「大丈夫なら公園に戻る」に、「待って待って、早く」と引き止める。',
      mean: 'If you’re all right は帰るための確認。大丈夫でなければ引き止めが来る。',
      trap: '帰る場面はお礼で終わりやすいが、if への答えは「大丈夫じゃない」。',
      use: 'If you’re okay, I’ll get going.（大丈夫なら、そろそろ行くね）' },

    // R fix: V2 (blind 60 %) + B1: "Did you know what… is?" was the odd form out. Now "You know what", the same words with
    //   "do" swallowed, natural in casual speech. The stem shows d3's "social security number": reveals `form`.
    // why: Don't ← a complaint reading ("don't you know…?"), n't lost; You know ← "do you" shrinks to "ju" and
    //   the do is lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'doyou', reveals: ['form'], seg: [119.8, 123.2],
      stem: 'Fill the gap: “___ my social security number is?”',
      choices: ['Do you know what', 'Don’t you know what', 'You know what'], a: 0,
      cue: '文の最初、とても短く弱い音のかたまり。',
      line: '*Do you know what* my social security number is?',
      said: '「ぼくの社会保障番号、知ってる？」と聞く。Do you は「ジュ」に縮む。',
      mean: 'Do you know what が一息で「ジュノワッ」。用紙を書くための質問。',
      trap: 'Don’t なら「知らないの？」と責める意味。n’t の t が消えても「ン」は残る。',
      use: 'Do you know what time it is?（今何時か分かる？）' },

    // R fix: V2 (blind 50 %): each half of the key is now shared by one distractor, so both halves must be heard.
    // why: blood type ← a medical-form item, with the right first half; phone number ← "number" heard, with the
    //   right second half
    { id: 'd3', skill: 'detail', level: 'B1', point: 'form', reveals: ['doyou'], seg: [119.8, 125.5],
      stem: 'For the dentist’s form, what does Andy ask Ron to tell him?',
      choices: ['His security number and any allergies', 'His security number and his blood type',
                'His phone number and any allergies'], a: 0,
      cue: '「Do you know what my」と「Or if I’m」のあと。',
      line: 'Do you know what my *social security number* is? Or if I’m *allergic* to anything?',
      said: '「ぼくの社会保障番号、知ってる？何かアレルギーある？」とロンに聞く。',
      mean: '本人が知っているはずのことを、人に聞いている。',
      trap: '病院の用紙でよく聞かれる項目を思い浮かべやすい。Do you know のあとを聞き取る。',
      use: 'I’m allergic to peanuts.（ピーナッツアレルギーです）' },

    // anchor: 119.8–131.6 s Andy asks Ron for his own security number and allergies (what a parent knows of a child);
    //   139.4–143.9 s "All I wanted was two hours where I got to forget that I was a parent"
    // R fix: V2 (blind 70 %): two distractors were the same misreading (missing his kids), which made the key the odd
    //   one out. One is now a sincerity flip ("better company"). The stem's "two hours" is n1's key: reveals `hours`.
    // why: misses his kids ← "parent" heard as longing for home (the talking head's "I love being a father"); better
    //   company ← the lament read as praise, Andy against the noisy kids at home
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'parent', reveals: ['form', 'hours'], seg: [119.8, 144.0], retired: true,
      stem: 'What does Ron’s line about two hours say about how he sees Andy?',
      choices: ['Minding Andy is like minding a child', 'Andy reminds him of the kids he misses',
                'Andy is better company than his kids'], a: 0,
      cue: 'アンディの質問の中身と、最後の parent。',
      line: 'All I wanted was two hours where I got to *forget that I was a parent*.',
      said: '自分の番号やアレルギーまで聞くアンディの横で、「親だと忘れる2時間がほしかった」と言う。',
      mean: '子どもから離れたのに、大人のアンディの世話で結局は親の役。子ども役は質問の中身で分かる。',
      trap: 'parent から家族を恋しがると取りやすい。逃げたものに、また捕まったという嘆き。',
      use: 'I feel like I’m babysitting.（子守りしてる気分だよ）' },

    // why: allergic to candy corn ← "candy corn" is the last thing he names; just found out ← "allergic… corn" heard
    //   as one fact
    { id: 'h3', skill: 'humor', level: 'C1', point: 'corn', reveals: ['form'], seg: [122.9, 132.2],
      stem: 'Why is Andy’s question about corn funny?',
      choices: ['He mixes up a food he dislikes with an allergy', 'He thinks it is candy corn he is allergic to',
                'He has just found out he is allergic to corn'], a: 0,
      cue: '「allergic」の質問のあと、彼が言う一文。',
      line: 'Or if I’m allergic to anything? *I don’t like corn.* Should I put that down?',
      said: 'アレルギーの話で「コーンは嫌い。書く？キャンディコーンは好きだけど」と言う。',
      mean: '嫌いな物とアレルギーは別。好きなお菓子まで心配する、ずれた真面目さ。',
      trap: '「コーンアレルギー」と取りやすいが、don’t like は好みの話。',
      use: 'I don’t like it, but I’m not allergic.（好きじゃないけど、アレルギーはない）' },

    // why: one hour ← "hours" with the -s missed; ten ← "two" and "ten" both short, the vowel blurred
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', reveals: ['parent'], seg: [139.0, 144.0], keep: true,
      stem: 'How much time to himself did Ron say he wanted?',
      choices: ['One hour', 'Two hours', 'Ten hours', 'Two days'], a: 1,
      cue: '「All I wanted was」のすぐあと。',
      line: 'All I wanted was *two hours* where I got to forget that I was a parent.',
      said: '「親だと忘れられる時間が、2時間ほしかっただけ」と言う。',
      mean: 'all I wanted was ＝「それだけでよかった」。小さな願いもかなわない嘆き。',
      trap: 'two と ten は短く母音が聞き取りにくい。hours の s で複数かも確かめる。',
      use: 'All I wanted was a nap.（昼寝がしたかっただけなのに）' },

    // why: only two ← "two" is said ("two completely different"); none ← the opposite direction, the same pictures
    { id: 'h4', skill: 'humor', level: 'C1', point: 'pictures', seg: [144.2, 150.4],
      stem: 'Why is the reply to “I found all three differences” funny?',
      choices: ['The pictures differ in every way, not just three', 'The puzzle only has two differences, not three',
                'The pictures are exactly the same, with none'], a: 0,
      cue: '返事の中の「completely」のあと。',
      line: 'I found all three differences. — Those are *two completely different pictures*.',
      said: '「三つの違い、全部見つけた！」に「それはまったく別の2枚の絵だ」と返す。',
      mean: '違い探しの絵ではなく、無関係な2枚を比べていた。三つどころか全部違う。',
      trap: 'two が聞こえて「違いは二つ」と取りやすい。two は違いでなく絵の数。',
      use: 'Those are two completely different things.（それ、まったく別物だよ）' },
  ]
};
