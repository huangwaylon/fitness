// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 1; ear checks 1
// “Ross Was a Medical Marvel | Friends” (the official Friends channel, Best of Season 7): with their parents' house
// being sold, Monica says the parents always favored Ross; in the garage Ross shows Dad that his boxes are dry and
// Monica's are moldy, Dad half-admits they favored him, and Ross cuts off the story of why he was a "medical marvel".
// Segments from the captions, words from whisper (2026-11-16). Only "Dad" is named in the audio (12.9 s, 54.7 s);
// 0–31 s is Ross and Monica alone, 31–58 s is Ross and Dad, so the stems name speakers by these turns.
// Note: 10.0 s a1 — both sources have "I kept your room for a while" (Ross must mean "They kept…"); the stem paraphrases
//   it, and the key holds either way, so it's off the ear list (R).
// EAR CHECK: 25.6 s c2 — the stress in "As much as they love you?" falls on "you" (ship only once confirmed)
// Untested on purpose: 16.8–22.2 s (the "tanning bed and Victoria's Secret catalogs" joke: innuendo), 58.9–61 s
// (whisper invents "You're welcome").
import type { Clip } from '../types.ts';

export const rossMarvel: Clip = {
  id: 'rossmarvel', video: 'ksopMY3_FWo', title: 'Ross Was a Medical Marvel', dur: 69, wpm: 166, band: 'fast',
  tags: ['家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (75 % blind). "Do the parents love Ross more?" was the only emotional choice, and g2, a3 and pr1 state
    //   it. Asked from another angle now: how Ross's side shifts. Tracking his stance across the scene: C1. Reveals
    //   g2's `garage` and p2's `blame`.
    // why: Dad's side ← in the garage he boasts "all my stuff is safe and dry", which sounds like siding with Dad;
    //   sorry ← "growing new stuff" is a tease, but no apology follows
    { id: 'g1', skill: 'gist', level: 'C1', point: 'turn', reveals: ['garage', 'blame'], seg: [0, 58.4],
      stem: 'How does Ross’s position on Monica’s complaint change over the scene?',
      choices: ['He waves off her worry, then argues her case to Dad', 'He agrees with her at first, then takes Dad’s side',
                'He teases her at first, then says he’s sorry to her'], a: 0,
      cue: '前半の Come on と、後半の問い返し。',
      line: 'Come on, you know they love you. … Well, *can you blame her?*',
      said: '前半は「愛されてるって」と流すが、ガレージでは父に「責められる？」と彼女の側に立つ。',
      mean: '最初は慰めで片付け、箱の差を見たあとは、彼女の言い分を父に伝える役に回る。',
      trap: '自分の箱が無事だという所だけ聞くと父の味方に見える。誰に何を言っているかを追う。',
      use: 'Okay, I see where she’s coming from.（彼女の言い分も分かる）' },

    // why: was ← "is" shrinks to a "z" after "stranger"; has been ← "be living" heard as "been living"
    { id: 's2', skill: 'sound', level: 'B2', point: 'stranger', seg: [0, 3.3],
      stem: 'Fill the gap: “Some stranger ___ in my room.”',
      choices: ['is going to be living', 'was going to be living', 'has been living'], a: 0,
      cue: 'stranger のあと、短く弱い一語と時制。',
      line: 'Man, some stranger *is going to be living* in my room.',
      said: 'ロスが「知らない人が僕の部屋に住むことになるのか」とぼやく。',
      mean: 'is はほぼ「ズ」だけ。これから起きることで、家が人手に渡ると分かる。',
      trap: 'been living なら「もう住んでいる」。be と been は「ン」の有無で分ける。',
      use: 'Someone is going to be using this desk.（この机、誰かが使うことになる）' },

    // why: fifty ← -teen/-ty; twenty ← "20 minutes" comes a few lines later; five ← "fif-" caught, the ending lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', reveals: ['shrine'], seg: [2.9, 9.6], keep: true,
      stem: 'How long did Mom and Dad keep Ross’s room for him?',
      choices: ['Five years', 'Fifteen years', 'Twenty years', 'Fifty years'], a: 1,
      cue: 'after のすぐあと、数字の語尾の強さ。',
      line: 'after *15 years* of Mom and Dad keeping it as a shrine to you',
      said: '「15年も記念館みたいに部屋を残してたんだから」とモニカ。',
      mean: 'fifteen は後ろの teen が強く長い。fifty なら前の fif が強い。',
      trap: '-teen と -ty は強さの位置で聞き分ける。あとの 20 とも混ぜない。',
      use: 'I’ve lived here for fifteen years.（ここに15年住んでいます）' },

    // R fix: V2/K1. "Letting Ross come back to visit" was defensible (the house is being sold, so visits end too).
    //   It's now a keyword trap on "Mom and Dad keeping it". The key no longer glosses the idiom with "in his honor".
    // why: curtains ← "velvet… came down" read literally as a decoration taken down; off-limits ← "Mom and Dad keeping
    //   it" heard in the wrong relation, with the ropes as a barrier
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'shrine', seg: [2.9, 9.6],
      stem: 'What does Monica say is ending for Ross’s room?',
      choices: ['Being kept like a museum piece for him', 'Having its old velvet curtains hung up',
                'Being kept off-limits to Mom and Dad'], a: 0,
      cue: 'shrine と、そのあとの「ロープ」のたとえ。',
      line: 'keeping it as a *shrine* to you, it’s time the *velvet ropes came down*.',
      said: '「15年も記念館扱いだったけど、もうロープは外す時ね」。',
      mean: 'velvet ropes は美術館で展示を囲むロープ。特別扱いはもう終わり、という皮肉。',
      trap: 'came down を「下ろす」と聞くと飾りの話に取りやすい。たとえは shrine とつなぐ。',
      use: 'Time to take the velvet ropes down.（もう特別扱いはおしまい）' },

    // R fix: V2. "Nowhere near true" was the only strong reading; now all three are short reactions, and the gym line
    //   is in the third.
    // why: begs ← "please" read literally as a plea; grants ← "for a while" heard as her granting it, then the gym line
    //   taken as a separate gripe
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'please', reveals: ['gym', 'minutes'], seg: [9.4, 16.4],
      stem: 'When Ross says her room was kept for a while too, how does Monica react?',
      choices: ['She scoffs: it was barely kept at all', 'She begs him to stop going on about it',
                'She grants it, then adds a gripe about Dad'], a: 0,
      cue: '文頭の短い2語の言い方と、そのあとの数字。',
      line: '*Oh, please.* Dad turned my room into a gym 20 minutes after I moved out.',
      said: '「よく言うわ。パパは私が出て20分でジムにしたのよ」。',
      mean: 'Oh, please. は「ばかばかしい」。20分は大げさで、全く残されなかったと言いたい。',
      trap: 'please を「お願い」と取りやすい。下げ調子の Oh, please. は打ち消しの合図。',
      use: 'Oh, please. You love it.（よく言うよ。好きなくせに）' },

    // R fix: S3. The cue ("turned my room into") held two words only the key has.
    // why: guest room ← the "stranger living in my room" at the start; storage room ← her boxes come up later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'gym', seg: [12.4, 16.4],
      stem: 'What did Dad do with Monica’s room?',
      choices: ['Turned it into a gym', 'Made it a guest room', 'Filled it with boxes'], a: 0,
      cue: '部屋の話のあと、何に変えたかの名詞。',
      line: 'Dad turned my room into *a gym*…',
      said: '「パパは私の部屋をジムにした」とモニカが言う。',
      mean: 'turn A into B ＝ AをBに変える。娘の部屋はすぐに別の用途になった、という話。',
      trap: '最初の stranger が住む話と混ぜて「客間」と取りやすい。into のあとの名詞を待つ。',
      use: 'We turned the garage into an office.（ガレージを仕事部屋にした）' },

    // why: twelve ← the "tw-" start; two weeks ← "twen-" with the end lost, read as a believable time; twenty days ← the
    //   number caught, the unit lost
    { id: 'n2', skill: 'number', level: 'B1', point: 'minutes', reveals: ['gym'], seg: [12.4, 16.4], keep: true,
      stem: 'How soon after Monica moved out did Dad change her room?',
      choices: ['Twelve minutes', 'Twenty minutes', 'Two weeks', 'Twenty days'], a: 1,
      cue: 'gym のすぐあと、数字とその単位。',
      line: 'Dad turned my room into a gym *20 minutes* after I moved out.',
      said: '「出ていって20分後には、パパが部屋をジムにしてた」とモニカ。',
      mean: '本当の時間ではなく「すぐに」の大げさな言い方。twenty の t は弱く「トゥエニ」に近い。',
      trap: '大げさすぎる数字だと思い、日や週に聞き替えやすい。数字のあとの単位まで聞く。',
      use: 'He was asleep five minutes after dinner.（夕食後5分で寝てた）' },

    // R fix: V2. "Turns his comfort into a point about favorites" was the only knowing choice; the two literal readings
    //   are now as specific as the key.
    // why: checks ← a rising question taken as a real question; agrees ← "as much as" heard as "just as much"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'asmuch', seg: [22.6, 27.4],
      stem: 'When Ross says their parents love her, what does Monica’s reply do?',
      choices: ['Throws his comfort back as a jab at him', 'Checks how much he thinks they love her',
                'Agrees and says they love him just as much'], a: 0,
      cue: '短い問い返しで、何と何を比べているか。',
      line: 'Come on, you know they love you. — *As much as they love you?*',
      said: '「ほら、愛されてるって」に、「あなたと同じくらい？」と問い返す。',
      mean: '答えを求める質問ではなく「あなたほどじゃない」という反論。慰めを比べる話に変える。',
      trap: '上がり調子でも本当の質問とは限らない。相手の言葉をそのまま返す問いは、たいてい反論。',
      use: 'As much as you love your phone?（スマホと同じくらい？）' },

    // R fix: V2 (70 % blind). Only the key's reason made sense ("asking for an exact amount" was a filler). Each choice
    //   now gives a reading a speaker could mean.
    // why: on "much" ← "how much" heard as "they love me, just not enough"; on "love" ← the bitter tone heard as
    //   doubting the love itself
    // anchor: 23.2–26.4 s Ross's "they love you" (you = Monica) comes back word for word as "they love you" (you = Ross):
    //   the same words, the other person
    // retired: the ear-check policy: a C2 stress item (the stress in “As much as they love you?” on “you”, 25.6 s); back
    //   after the ear check
    { id: 'c2', skill: 'sound', level: 'C2', point: 'asmuch', seg: [22.6, 27.4], retired: true,
      stem: 'Where is the stress in Monica’s “As much as they love you?”, and why?',
      choices: ['On “you”: Ross, not her, is the loved one', 'On “much”: they love her, just not enough',
                'On “love”: they put up with her, no more'], a: 0,
      cue: '同じ言葉を返すとき、どの語が強く長いか。',
      line: 'you know they love *you*. — As much as they love *you*?',
      said: 'ロスの「愛されてるよ」を、モニカが同じ言葉で問い返す。',
      mean: 'ロスの you はモニカ、モニカの you はロス。you を強めて人を入れ替え、比べる形にする。',
      trap: 'love を強めると愛そのものを疑う意味になる。ここは誰が多く愛されているかの話で、強勢は比べる相手に来る。',
      use: 'Not me. You’re the busy one.（僕じゃない、忙しいのは君）' },

    // R drop: d2 (V1/K3). Show knowledge settles "first" (Ross is the older one), and "only child" is out because
    //   Monica is there. Replaced by d3 (literal stays 4).

    // R fix: V2. The title ("Medical Marvel") and a sick-baby filler pointed at the key. The medical distractor now
    //   competes with it. `firstborn` left the bank with d2.
    // why: a boy ← "firstborn" heard as "first son", a common family hope; might not live ← "barren" unknown, filled in
    //   from the title's "medical"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'marvel', seg: [26.3, 31.5],
      stem: 'What does Ross suggest made his birth special to their parents?',
      choices: ['Mom had been thought unable to have kids', 'They had been told the baby might not live',
                'They had been hoping hard for a boy first'], a: 0,
      cue: 'firstborn のあと、母親についての一語。',
      line: 'I was their firstborn. They thought she was *barren*.',
      said: '「僕が最初の子。ママは子どもができないと思われてた」。',
      mean: 'barren ＝ 子どもができない。だから自分は待ち望まれた子だった、と特別扱いを説明している。',
      trap: '知らない語は前の firstborn とつなげて絞る。she は母親。',
      use: 'We’d almost given up hope.（ほとんどあきらめかけていた）' },

    // R fix: V2. The key spelled out the joke ("so wet that mold") against two fillers. All three now start "Her stuff"
    //   and read "growing" a different way.
    // why: worth more ← "growing" read as value growing; more boxes ← "new stuff" taken as new things she added
    { id: 'h3', skill: 'humor', level: 'C1', point: 'mold', reveals: ['safe'], seg: [31.4, 39.3],
      stem: 'Why does Ross’s line about Monica’s boxes get a laugh?',
      choices: ['Her stuff is so damp that it’s sprouting mold', 'Her stuff has gained value while his sat around',
                'Her stuff keeps growing as she sends more boxes'], a: 0,
      cue: '自分の物の「乾いてる」と、彼女の物の比べ方。',
      line: 'all my stuff is safe and dry, and all her stuff is *growing new stuff*.',
      said: '「僕の物は乾いてる。彼女の物には新しい物が育ってる」。',
      mean: '濡れた箱にカビが生えた、を「新しい物が育つ」と遠回しに言うおかしさ。dry との対比がヒント。',
      trap: 'new stuff を「買い足した物」と取りやすい。直前の dry と並べて聞く。',
      use: 'The bread is growing new stuff.（パン、カビ生えてる）' },

    // R fix: V2. The key ("Monica feels loved less") was the only feelings choice, the theme every other stem states.
    //   All three are about the boxes now.
    // why: own boxes ← "all my stuff is safe" heard as boasting about his spot; packed better ← "her stuff is
    //   growing…" heard as blaming Monica
    { id: 'g2', skill: 'gist', level: 'B2', point: 'garage', seg: [31.4, 58.4],
      stem: 'In the garage, what is Ross trying to get Dad to see?',
      choices: ['What the boxes say about how they treat Monica', 'Why his own boxes should get the best spot',
                'Why Monica should have packed her boxes better'], a: 0,
      cue: 'See で始まる文で、何が彼女にそう思わせるか。',
      line: 'this is exactly the kind of thing that makes her think *you guys love me more*…',
      said: '箱の扱いの差を見せ、「こういうことで、僕の方が愛されてると彼女は思うんだ」と父に言う。',
      mean: '自分の箱の話は自慢ではなく、モニカの気持ちを父に分からせるための例。',
      trap: '自分の物が無事だという部分だけでは自慢に聞こえる。See のあとに話の目的が来る。',
      use: 'See, this is what I’m talking about.（ほら、こういうことだよ）' },

    // R new: replaces d2 to keep literal at 4. My blind read (stem + choices only): 35 %, since all three are the
    //   scene's examples of favoritism.
    // why: gym ← Monica's "turned my room into a gym", said earlier, is the same kind of thing; kept his room ← the
    //   "15 years… shrine" said earlier
    { id: 'd3', skill: 'detail', level: 'B2', point: 'garage', reveals: ['mold', 'safe'], seg: [31.4, 44.3],
      stem: 'What does Ross mean by “this” in “this is exactly the kind of thing”?',
      choices: ['How her things got ruined while his stayed dry', 'How Dad turned her room into a gym so fast',
                'How they kept his room as it was for years'], a: 0,
      cue: 'See の直前に見せていたもの。',
      line: 'all my stuff is safe and dry, and all her stuff is growing new stuff. *See, this* is exactly the kind of thing…',
      said: '箱の差を見せ、「ほら、こういうことが彼女にそう思わせる」と父に言う。',
      mean: 'this は目の前の箱の差。ジムや部屋の話は、モニカが前にしたもの。',
      trap: 'ひいきの例はほかにも出るので、どれも合いそうに見える。this は直前に見せたものを指す。',
      use: 'This is exactly the kind of thing I hate.（まさにこういうのが嫌なんだ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'safe', seg: [31.6, 34.4],
      stem: 'Type what Ross says: “All my stuff is ___.” (3 words)', answer: 'safe and dry',
      cue: 'Look のあと。真ん中の and はとても弱い。',
      line: 'Look, all my stuff is *safe and dry*,',
      said: '「僕の物は全部、無事で乾いてる」とロス。',
      mean: 'safe and dry ＝ 無事で濡れていない。and は弱く、「セイファン」とつながる。',
      trap: 'safe の f と and がつながって一語に聞こえやすい。and は「ン」だけになることが多い。',
      use: 'We made it home safe and dry.（濡れずに無事帰れた）' },

    // R fix: V2. "He isn't sure what she thinks" was weak, since he has just said what she thinks; now the dodge reading
    //   (a question back read as not wanting to answer, the Japanese frame).
    // why: her fault ← "blame" read literally; rather not say ← a question answered with a question heard as dodging
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'blame', seg: [39.1, 47.9],
      stem: 'When Dad asks if Monica really thinks that, what does Ross’s answer mean?',
      choices: ['It’s easy to see why she would', 'It’s her own fault she thinks so', 'He’d rather not say what she thinks'],
      a: 0,
      cue: '質問に質問で返す形と、そこで使われる動詞。',
      line: 'does she really think that? — Well, *can you blame her?*',
      said: '「本当にそう思ってるのか」に「責められる？」。',
      mean: 'Can you blame her? ＝「そう思うのも無理はない」。答えを求めない問いで同意を促す。',
      trap: 'blame を「彼女のせい」と取りやすい。can you で始まる問い返しは「無理もない」。',
      use: 'Can you blame me for staying in?（家にいたくもなるでしょ）' },

    // why: never blame ← blame taken literally, so he answers "no" to the words; love both ← the comforting parent
    //   script, which denies her view
    // anchor: 47.8–51.0 s Dad's actual reply, "I don't know. I suppose we may have favored you unconsciously", takes
    //   Ross's question as "she has a point"
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'blame', reveals: ['favor', 'mayhave'], seg: [43.8, 51.6], retired: true,
      stem: 'Which reply from Dad would match what Ross meant?',
      choices: ['Fair point. Her boxes do look bad.', 'I would never blame her for anything!',
                'But we love you both the same!'], a: 0,
      cue: '父の実際の返事と比べて、問いの意味を考える。',
      line: 'Well, can you blame her? — I don’t know. I suppose we *may have favored you*…',
      said: '「責められる？」に、父は「無意識にお前をひいきしたのかも」と答える。',
      mean: '問いの形の「無理もない」。正しく受け取れば、まず言い分を認める。実際の父の答えも、ひいきを半ば認めている。',
      trap: '言葉の形に「責めない」と答えると中身を外す。「同じだけ愛してる」は、彼女の思いを打ち消す返事。',
      use: 'Fair point. I’ll call her tonight.（もっともだ。今夜電話するよ）' },

    // R fix: V2/N7 (70 % blind). The key was the only hedged choice; all three hedge now. s1's stem quotes the answer,
    //   so s1 reveals `favor`.
    // why: knowingly ← "favored you" caught without "unconsciously"; probably not ← "I don't know" heard as a denial,
    //   then the parent's comfort script
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'favor', reveals: ['mayhave'], seg: [43.8, 51.6],
      stem: 'How does Dad answer the idea that they love Ross more?',
      choices: ['Maybe so, though they never meant to', 'Maybe so, and they did it knowingly',
                'Probably not, though he can’t be sure'], a: 0,
      cue: 'I don’t know のあとの、言い切らない言葉の数。',
      line: 'I don’t know. I *suppose* we *may have* favored you *unconsciously*.',
      said: '「さあな。無意識にひいきしてたのかもな」と父。',
      mean: 'suppose・may have・unconsciously を重ね、半ば認めつつ「わざとではない」。',
      trap: 'I don’t know で否定と思いやすい。最後の unconsciously まで聞く。',
      use: 'I suppose I may have overreacted.（ちょっと言いすぎたかもしれない）' },

    // R fix: V2/N7. "I suppose we never favored" doesn't fit "suppose", so it was a filler; "might have" is the near
    //   sound now. The stem and line state a3's key, so it reveals `favor`.
    // why: might ← the m- start and a dropped t ("migh'uv"); must ← the m- start, "have" kept; may favor ← "have"
    //   shrinks to "uv" and gets lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'mayhave', reveals: ['favor'], seg: [47.8, 51.6],
      stem: 'Fill the gap: “I suppose we ___ you unconsciously.”',
      choices: ['may have favored', 'might have favored', 'must have favored', 'may favor'], a: 0,
      cue: 'we のあと、とても短くつながる2語。',
      line: 'I suppose we *may have favored* you unconsciously.',
      said: '「無意識にひいきしてたのかも」と父。',
      mean: 'may have は「メイアヴ」のように短くつながり、have の h はほぼ消える。過去の推量。',
      trap: 'have が消えると may favor（今もひいき）に聞こえる。-ed も弱いので両方で判断する。',
      use: 'I may have left it at home.（家に忘れてきたかも）' },

    // R fix: V2. "Private details" was the knowing choice (why else stop him?), and "stop at one child" was weak. All
    //   three are now medical stories, matching "medical marvel… the doctor said".
    // why: sick ← "medical" and "the doctor" heard as an illness; nearly died ← "your mother couldn't…" filled in with
    //   a hard birth
    { id: 'i2', skill: 'infer', level: 'B2', point: 'marvel', seg: [51.2, 56.2],
      stem: 'What was Dad about to tell Ross when Ross stopped him?',
      choices: ['How Mom got pregnant despite the odds', 'How sick Ross was as a newborn baby',
                'How Mom nearly died giving birth'], a: 0,
      cue: '「医学の奇跡」と、途中で止まった文の主語。',
      line: 'You were a *medical marvel*. The doctor said your mother couldn’t… — Dad, Dad, I don’t want to hear about it.',
      said: '「医者は母さんが…」と言いかけ、ロスが「聞きたくない」と止める。',
      mean: '子どもはできないと言われた、という夫婦の体の話が続くはず。息子は聞きたくない。',
      trap: 'medical や doctor から病気を想像しやすい。主語は your mother。',
      use: 'Okay, that’s more than I needed to know.（そこまで聞かなくていいよ）' },

    // R fix: V2. The two distractors didn't explain a laugh. All three are now "He backs off …: …", three readings of
    //   the climb-down.
    // why: busy ← "not right now" taken as a scheduling reply; shame ← "Well," after "Dad, Dad" heard as an embarrassed
    //   apology
    { id: 'h2', skill: 'humor', level: 'C1', point: 'notnow', seg: [53.0, 58.4],
      stem: 'Why does Ross’s last line get a laugh?',
      choices: ['He backs off his “no”: he does want to hear it', 'He backs off politely: he’s just too busy now',
                'He backs off in shame: he snapped at Dad'], a: 0,
      cue: 'Really? と聞かれたあとの返事の中身。',
      line: 'I don’t want to hear about it. — Really? — Well, *not right now*.',
      said: '「聞きたくない」と止めたのに、「本当に？」と聞かれ「まあ、今はね」と言い直す。',
      mean: '「今は」と言うことで、あとでなら聞きたいと認めてしまう。直前の強い拒否とのずれが笑い。',
      trap: '予定の都合と取ると、どこが面白いか分からない。言い直しは本音がもれる合図。',
      use: 'Well, not right now. Maybe later.（今はいいや。あとでね）' }
  ]
};
