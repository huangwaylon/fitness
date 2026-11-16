// “I'm Fine, B*tch, I'm Fine - The Office US” (the official The Office channel, BEST OF The Office - Season 8): Jim and
// Pam can't agree on how to answer a child who fears a ghost; then a colleague tells the office a horror story that
// drifts into a lonely woman's life, ends on a rude anticlimax, and turns into a short speech about fear.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 172 s; whisper's repeated "We take a
// day a year…" after 172 s is a loop. Pam is "Mom" in Jim's example and is addressed as the one who'd answer; the
// storyteller is never named, so no stem names him. Untested on purpose: 22–28 s (a suicide in the story), 76–80 s
// ("Tall. Slim." then "Jim", speaker unclear), the baby's swear word (captions "[__]"), and the gonna/going to at
// 10.4 s and 12.6 s (whisper "gonna", captions "going to").
// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 1 (unchanged)
// EAR CHECK: 169.7 s p3 — whisper runs "…and celebrate fear" on at once; the captions put "fear" at 178.6 s after
//   music; the segment covers both, but confirm "fear" is the word that ends the sentence
import type { Clip } from '../types.ts';

export const imFine: Clip = {
  id: 'imfine', video: '9Ex4UcLaYNc', title: 'I\'m Fine, B*tch, I\'m Fine', dur: 193, wpm: 161, band: 'slow',
  tags: ['家', '職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 %: "at home" and "some night" made the choices uneven. Now three bare time readings
    // why: road trip ← road = 道, read as a place; years ago ← "a few years" with "down the road" read as looking back
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'road', seg: [0, 4.75],
      stem: 'At the start, when does Jim say the ghost moment takes place?',
      choices: ['Some years from now', 'Some years ago', 'On a road trip someday'], a: 0,
      cue: '文の最初、years のあとに続く三語。',
      line: 'Like *a few years down the road*, CeCe says…',
      said: '「何年か先に、CeCe が『ママ、クローゼットにおばけがいる』と言ったら」と仮定する。',
      mean: 'down the road ＝ 先々・将来。道の先を未来にたとえる言い方。',
      trap: 'road を文字通りの道と取りやすい。years と組むと、時間の「先」を表す。',
      use: 'We’ll move a few years down the road.（何年か先に引っ越すつもり）' },

    // R fix: V2, blind 75 %: "old enough" was a filler. The new one hangs on "let's go see what it wants"
    // why: check the closet ← "let's go see what it wants" heard as a plan for who goes; which story ← "ghost" plus
    //   the scary story that follows in the clip
    { id: 'g1', skill: 'gist', level: 'B2', point: 'answer', seg: [0, 15.2],
      stem: 'What are Jim and Pam disagreeing about?',
      choices: ['How to answer CeCe if she says there’s a ghost', 'Which of them should go check CeCe’s closet',
                'Whether to read CeCe a ghost story at bedtime'], a: 0,
      cue: 'Jim が出す二つの案と、それへの返事。',
      said: 'Jim が「おばけがいると言われたら、答えは二つ」と案を出し、Pam はどちらも断る。',
      mean: '将来の子育ての「もしも」の話。答え方をめぐって二人の考えが合わない。',
      trap: 'ghost から「怖い話を聞かせるか」の話と取りやすい。話題は、子どもへの返事の仕方。',
      use: 'What would you say if she asked?（もし聞かれたら何て言う？）' },

    // why: not real ← the usual parent answer, close in meaning; back to sleep ← "dream" brings bedtime to mind
    { id: 'd1', skill: 'detail', level: 'B1', point: 'options', seg: [4.3, 10.35],
      stem: 'What is the first answer Jim suggests giving CeCe?',
      choices: ['That she’s only having a bad dream', 'That there’s no such thing as ghosts',
                'That she should go back to sleep'], a: 0,
      cue: 'One のあとの文。',
      line: 'One, *you’re just having a bad dream*.',
      said: '一つ目は「ただの悪い夢だよ」と言うこと。',
      mean: 'One, … Or two, … と、選択肢を数えながら出している。',
      trap: '「おばけなんていない」も親の定番なので選びやすい。One のあとの言葉をそのまま聞く。',
      use: 'You’re just tired, that’s all.（疲れてるだけだよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'options', seg: [7.9, 10.35],
      stem: 'Type Jim’s second option: “Or two, let’s go ___.” (4 words)', answer: 'see what it wants',
      cue: 'let’s go のすぐあと、文の終わりまで。',
      line: 'Or two, let’s go *see what it wants*.',
      said: '二つ目は「何の用か見に行こう」と言うこと。',
      mean: 'what it は t が弾んで「ワリッ」に近く、wants の t もほぼ消える。',
      trap: 'what‿it が一語に聞こえ、語数が足りなくなりやすい。疑問詞のあとの主語を探す。',
      use: 'Let’s go see what’s going on.（何があったか見に行こう）' },

    // why: feel silly ← "freak" heard as 変人 (katakana フリーク); tell off ← "out" with a scolding verb
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'freak', seg: [9.9, 15.2],
      stem: 'What does Pam refuse to do to CeCe with the second option?',
      choices: ['Scare her badly', 'Make her feel silly', 'Tell her off'], a: 0,
      cue: 'Jim の名前で終わる、最初の返事。',
      line: 'I’m not gonna *freak her out*, Jim.',
      said: '「あの子を怖がらせたりしない」と、二つ目の案を断る。',
      mean: 'freak … out ＝ ひどく怖がらせる・動揺させる。会話でよく使う。',
      trap: 'freak をカタカナの「フリーク（変わり者）」と取りやすい。out と組むと強い動揺。',
      use: 'Don’t freak out. It’s just a spider.（落ち着いて。ただのクモだよ）' },

    // why: lies too often ← "lie" heard as a charge against Jim; won't pretend ← "lie" tied to option two (playing
    //   along with the ghost)
    { id: 'i1', skill: 'infer', level: 'C1', point: 'lie', seg: [9.9, 15.2],
      stem: 'What does Pam’s second refusal suggest about her?',
      choices: ['She thinks the ghost might be real', 'She thinks Jim lies to CeCe a lot',
                'She won’t pretend to see a ghost'], a: 0,
      cue: '二つ目の返事が、どちらの案を断っているか。',
      line: 'I’m not gonna *lie to her, either*.',
      said: '一つ目の案（ただの夢）も「うそはつかない」と断る。',
      mean: '「夢だよ」をうそと呼ぶなら、おばけが本当にいるかもと思っていることになる。',
      trap: 'lie を Jim への非難と取りやすい。either で、一つ目の案のことだと分かる。',
      use: 'I don’t want to lie to you.（あなたにうそはつきたくない）' },

    // R fix: V2, blind 50 %: the key was the only "fed up". Now two fed-up readings and an urging one
    // why: liar ← "lie" taken as calling Jim a liar; urging ← come on = さあ, an invitation to play along
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'comeon', reveals: ['lie'], seg: [9.9, 15.2],
      stem: 'How does the reply to Pam’s second refusal sound?',
      choices: ['Fed up that both options are out', 'Fed up that she called him a liar', 'Urging her to play along with him'], a: 0,
      cue: '二つ目の返事のあと、短い叫び。',
      line: 'I’m not gonna lie to her, either. — *Oh, come on!*',
      said: '二つ目の案も断られて「勘弁してよ！」と返す。',
      mean: 'Oh, come on! ＝ 「そんなのありかよ」。どちらも断られて、もう選べない。',
      trap: 'come on を「さあ」の誘いと取りやすい。不満や抗議にも使う。lie は Jim でなく娘への話。',
      use: 'Oh, come on! That’s not fair.（えー、ずるいよ！）' },

    // why: couple ← "husband" comes up later in the story; old man ← the man in the rumor at 22–28 s
    { id: 'd6', skill: 'detail', level: 'B1', point: 'lydia', seg: [28.6, 34.7],
      stem: 'Who moves into the empty house in the story?',
      choices: ['A young woman and her baby', 'A young couple and their baby', 'An old man and his dog'], a: 0,
      cue: 'One day のあと、名前と一緒に。',
      line: '*a young woman*, Lydia, moved into the house *with her infant child*.',
      said: 'ある日、リディアという若い女性が赤ん坊と一緒に引っ越してくる。',
      mean: 'infant child ＝ 乳児・赤ん坊。物語の主役の二人が出てくる場面。',
      trap: 'あとで夫の話が出るので夫婦と思いやすい。引っ越してきた時は女性と赤ん坊だけ。',
      use: 'We just moved into a new place.（新しい家に引っ越したばかり）' },

    // why: spider ← a crib and a creeping threat; ghost ← the opening talk about a ghost in the closet
    { id: 'd4', skill: 'detail', level: 'B1', point: 'snake', seg: [42.5, 50.3],
      stem: 'What does Lydia find in the baby’s crib?',
      choices: ['A snake', 'A spider', 'A ghost'], a: 0,
      cue: 'crib のあと、was a に続く語。',
      line: 'there, in Baby’s crib, was *a snake* wrapped around Baby’s neck',
      said: 'ベビーベッドの中で、何かが赤ん坊の首に巻きついていた。',
      mean: '前の「シューッという音」が伏線。巻きつく動きとも合う。',
      trap: '最初におばけの話があるので ghost に引かれやすい。was a のあとの名詞を聞く。',
      use: 'There’s a spider in the bathtub!（お風呂にクモがいる！）' },

    // R fix: V2 (and V1), blind 50 %: shock is the common-sense reaction to a horror story. The new distractor is scared
    //   too, so the words decide (an exclamation, not a request)
    // why: amused ← the story is over the top, so a laugh seems likely; asking to stop ← a scared listener's usual
    //   script, but no request is made
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'goodness', reveals: ['snake'], seg: [49.4, 55.5],
      stem: 'How does a listener react to the part about the crib?',
      choices: ['Shocked and drawn into it', 'Amused, as if it were a joke', 'Scared, and asking him to stop'], a: 0,
      cue: 'tighter のくり返しのあと、別の声。',
      line: 'squeezing tighter and tighter. — *Oh, my goodness*.',
      said: '首をしめつける場面で、聞き手が「まあ、なんてこと」と声をもらす。',
      mean: 'Oh, my goodness ＝ 驚きやショックの声。話に引き込まれている。',
      trap: '大げさな話なので笑い、怖い話なので「やめて」と取りやすい。言葉は驚きの声だけ。',
      use: 'Oh, my goodness, are you okay?（まあ、大丈夫？）' },

    // why: purpose ← for = 〜のために; next event ← a new sentence heard as the next step in the story
    { id: 'm1', skill: 'marker', level: 'C1', point: 'mummies', seg: [62.5, 73.6],
      stem: 'The sentence about mummies opens with a short word. What does it signal?',
      choices: ['A reason for what came just before', 'The purpose the bodies were there for',
                'A new event that came next'], a: 0,
      cue: '体が起き上がる話のすぐあと、文頭の一語。',
      line: 'Embalmed bodies rose… lurching toward Baby. *For* they were mummies.',
      said: '死体がひつぎから起き上がり、赤ん坊に迫る。「というのも、ミイラだったから」。',
      mean: '文頭の for ＝ なぜなら（古風な語り口）。分かりきった理由をわざわざ言う。',
      trap: 'for を「〜のために」と取りやすい。文頭で主語と動詞が続けば、理由を表す。',
      use: 'I stayed home, for it was raining.（家にいた。雨だったから）' },

    // R fix: V2, blind 70 %: the distractors left the story. Now all three are "from monsters to…"; said no longer
    //   hints at the gradual split (i2)
    // why: tall man ← "a man… Tall. Slim." just before the turn, and the rumored man at the start; husband ← "husband"
    //   is said three times right after
    { id: 'g2', skill: 'gist', level: 'B2', point: 'drift', seg: [62.5, 128.8],
      stem: 'How does the story change partway through?',
      choices: ['From monsters to a woman’s lonely life', 'From monsters to the tall man’s past',
                'From monsters to her husband’s side of it'], a: 0,
      cue: 'ミイラのあと、「夫」の話から何が語られるか。',
      said: 'ミイラが迫る場面から、夫との口論と別れ、そのあとの一人の日々へと話が移る。',
      mean: '怖い話のはずが、孤独な女性の物語になる。その脱線ぶりがこの場面の味。',
      trap: '直前の「背の高い男」や、くり返される husband に引かれやすい。主語の she を追う。',
      use: 'Anyway, where was I?（で、どこまで話したっけ）' },

    // C2 dict: the doubled "had" that a grammar instinct cuts to one
    // anchor: 90.6–92.2 s "her husband had had an argument" (both sources), the two "had"s run together before "an"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'hadhad', reveals: ['pastit'], seg: [89.4, 93.1],
      stem: 'Type the words: “For Lydia and her husband ___.” (4 words)', answer: 'had had an argument',
      cue: 'husband のすぐあと。同じ語が続いても全部。',
      line: 'For Lydia and her husband *had had an argument*, one they couldn’t get past.',
      said: '「リディアと夫は口論をしていたのだ」。had が二つ続き、an とつながる。',
      mean: '過去のある時点よりさらに前の出来事を表す過去完了。had had は文法どおりで、語り口の一部。',
      trap: '同じ語の重なりを言いよどみと取って、had を一つにしがち。聞こえた数をそのまま書く。',
      use: 'I had had enough by then.（その時にはもううんざりしていた）' },

    // R fix: V2, blind 60 %: the story (she leaves) ruled out "could". All three are now negatives, so only the sound
    //   decides
    // why: wouldn't ← /k/ and /w/ before the same "-ouldn't"; didn't ← a plain past negative, the t lost before "get"
    { id: 's1', skill: 'sound', level: 'B2', point: 'pastit', seg: [89.4, 94.95],
      stem: 'Fill the gap: “an argument, one they ___ get past.”',
      choices: ['couldn’t', 'wouldn’t', 'didn’t'], a: 0,
      cue: 'argument のあと、they に続く短い語。',
      line: 'an argument, one they *couldn’t* get past.',
      said: '「乗り越えられない口論」をした。',
      mean: 'get past ＝ 乗り越える。couldn’t は「クドゥン」に近く、n が否定の手がかり。',
      trap: 'wouldn’t や didn’t と聞き分けにくい。語頭の k の破裂と、母音の形を聞く。',
      use: 'I can’t get past the first chapter.（最初の章から先に進めない）' },

    // R fix: V2, blind 70 %: "one big fight" was a filler. The new one is "couldn't" heard as "could"
    // why: got past it ← couldn't's t lost, heard as "could get past"; every night ← "Each night" tied to "argument",
    //   as nightly fights
    { id: 'i2', skill: 'infer', level: 'B2', point: 'apart', seg: [89.4, 99.9],
      stem: 'What happened to Lydia and her husband?',
      choices: ['They drifted apart bit by bit, then she left', 'They got past it, but one night she left',
                'They fought every night, then she left'], a: 0,
      cue: 'Each night のあと、出ていくまでの流れ。',
      line: 'Each night, they *slept one inch farther apart* until one night, Lydia left.',
      said: '口論のあと、毎晩少しずつ離れて寝るようになり、ある夜リディアは出ていった。',
      mean: '少しずつ心の距離が開いて別れた、という比喩。',
      trap: 'couldn’t を could と聞いたり、Each night を毎晩のけんかと取りやすい。apart を聞く。',
      use: 'We just drifted apart.（なんとなく疎遠になった）' },

    // R fix: V2, blind 50 %: "two inches" was weak. Now "one" plus three US units, ascending
    // why: one foot ← "inch" and "foot" are both small US units, and the vowel of "inch" is short; one yard ← the
    //   biggest step, a reading for "farther"
    { id: 'n1', skill: 'number', level: 'B1', point: 'apart', seg: [94.5, 99.9], keep: true,
      stem: 'How much farther apart do they sleep each night?',
      choices: ['One inch', 'One foot', 'One yard'], a: 0,
      cue: 'slept のすぐあと。',
      line: 'they slept *one inch* farther apart',
      said: '毎晩「1インチ（約2.5センチ）」ずつ離れて寝た。',
      mean: 'ほんの少しずつ、毎晩離れていく。小さな数が時間の長さを感じさせる。',
      trap: 'inch は短く弱いので、foot など別の単位と取りやすい。数と単位をセットで聞く。',
      use: 'Move it an inch to the left.（左にちょっとずらして）' },

    // R fix: V2, blind 70 %: "read it from a book" and "sang it" were fillers, and the stem said she quits. Now the
    //   classroom sense of cite and a wrong-direction reading
    // why: quoting ← cite = 引用する; the groups' reason ← "citing" with its subject lost, heard as the clubs
    //   dropping her for not meeting "their high expectations"
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'quit', seg: [104.7, 111.5],
      stem: 'In the part about the book club and choir, what was the “high expectations” remark?',
      choices: ['Her reason for quitting them', 'A line she was quoting from a book', 'The groups’ reason for dropping her'], a: 0,
      cue: 'choir のあとの動詞。',
      line: 'She had quit the book club, the choir, *citing* something about their high expectations.',
      said: '読書会も合唱団もやめた。理由は「期待が高すぎる」とか何とか。',
      mean: 'citing ＝ 理由として挙げて。something about で理由はあいまい。',
      trap: 'cite は「引用する」と習いがち。理由の文脈では「挙げる」。主語は she。',
      use: 'He left early, citing a headache.（頭痛を理由に早退した）' },

    // R fix: V2, blind 60 %: "an accident" was the odd one out. Now three "stopped … anyone" readings
    // why: eating ← mouth closed = not eating, but she could eat alone; smiling ← lips = a smile, but a smile doesn't
    //   need the lips apart
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lips', seg: [111.1, 115],
      stem: 'What does the line about Lydia’s lips suggest?',
      choices: ['She had stopped talking to anyone', 'She had stopped eating with anyone',
                'She had stopped smiling at anyone'], a: 0,
      cue: 'grew together のあと、「何から」そうなったか。',
      line: 'Her lips slowly grew together *from disuse*.',
      said: '「使わなかったせいで、唇がだんだんくっついていった」。',
      mean: 'disuse ＝ 使わないこと。誰とも話さなくなった孤独を、大げさな比喩で言っている。',
      trap: '唇から食事や笑顔を連想しやすい。前の book club, choir をやめた話とつなげて読む。',
      use: 'My French is rusty from disuse.（使わないからフランス語がさびついた）' },

    // C2 plain-English paraphrase
    // R fix: V2, blind 50 %: "her face aged more" was a filler. The new one reads "hardened" as toughened (a direction
    //   flip), not a second "acted" reading
    // why: acted ← "didn't" loses its t and n before "another", so it sounds like "wanted to act and did"; tougher ←
    //   "hardened" heard as toughened, a strength
    // anchor: 115.1–120.5 s "every time she wanted to act and didn't": the hardening comes from holding back, and it
    //   follows the quit clubs and the closed lips (a life of not acting)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'stone', seg: [114.6, 120.7],
      stem: 'Which plain-English version keeps what the line about her face means?',
      choices: ['Each chance she let pass made her colder', 'Each time she spoke her mind, it cost her',
                'Each wish she held back made her tougher'], a: 0,
      cue: 'wanted to act のあと、and に続く短い語。',
      line: 'Every time she *wanted to act and didn’t*, another part of her face *hardened* until it was stone.',
      said: '「動きたいのに動かないたび、顔のどこかが固まり、ついに石になった」。didn’t は弱い。',
      mean: '石の顔は、我慢を重ねて心が閉じたことの比喩。原因は行動したことでなく、しなかったこと。',
      trap: 'didn’t の t が消えて did と聞こえやすい。そのあとの石になる話と合うかで、否定を確かめる。',
      use: 'Every time I wanted to call, I didn’t.（電話したくなるたび、しなかった）' },

    // R fix: V2, blind 85 %: the title gives the rude reply away (GUIDE §9.4), and "rude" was only in the key. The key
    //   now names the letdown, and the new distractor reads the reply as the scary climax
    // why: the man ← "a man, tall, slim" from the mummy scene, so the baby seems to be him; scarier ← a calm talking
    //   baby is the horror script's last twist, but the words are flat and rude, not creepy
    { id: 'h2', skill: 'humor', level: 'C1', point: 'fine', seg: [128.5, 143.2],
      stem: 'Why does the baby’s answer get a laugh?',
      choices: ['After all that build-up, the reply is so ordinary', 'The baby’s calm reply is scarier than the mummies',
                'The baby turns out to be the tall, slim man'], a: 0,
      cue: 'ゆっくり起き上がったあとの、短いひと言。',
      line: 'Baby sat up slowly, turned to mother, and said, “*I’m fine*… *I’m fine*.”',
      said: '赤ん坊がゆっくり起き上がり、母を見て、悪い言葉をはさんで「平気だよ」と言う。',
      mean: '怖い結末を待たせたあとに、ぶっきらぼうなふつうの返事。期待を外す落ちが笑い。',
      trap: '前に出た「背の高い男」とつなげたくなるが、言葉はただの「平気」。期待とのずれを聞く。',
      use: 'I’m fine. Stop asking.（大丈夫だって。もう聞かないで）' },

    // R fix: V2, blind 75 %: both distractors were off the topic of fear. Now a dare/did near sound and a "motivate"
    //   reading
    // why: how it got in ← "How dare we let it into" heard as "How did we let it into"; helps us ← "motivate" and
    //   "decision-making" heard as praise of fear
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'dare', seg: [151.7, 166.1],
      stem: 'After the story, what are his “How dare we…” questions doing?',
      choices: ['Saying we shouldn’t let fear rule us', 'Asking how fear got into our lives',
                'Saying fear helps us choose well'], a: 0,
      cue: 'Fear で始まる文のあと、くり返される問い。',
      line: '*How dare we let it motivate us?* How dare we let it into our decision-making…',
      said: '「恐怖に動かされていいのか。決断や関係に入れていいのか」と問う。',
      mean: '答えを求めない問いで、「恐怖に流されるべきではない」と主張している。',
      trap: 'How dare を how did と、motivate をほめ言葉と取りやすい。dare は「よくも」。',
      use: 'How can we let this happen?（こんなこと許していいの？）' },

    // R fix: V2, blind 70 %: "costumes don't scare anyone" was weak. The new one is the usual reason given for
    //   Halloween, and it's wrong by the last two words
    // why: dressing up ← "dress up in costume" heard as the odd part; hide ← dressing up as a way to hide from fear,
    //   but he says "celebrate fear"
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'costume', seg: [165.7, 179.3],
      stem: 'What contrast does he point out with “It’s funny, isn’t it?”',
      choices: ['We celebrate the very thing that rules us', 'Grown-ups dress up like children for a day',
                'We dress up to hide from what scares us'], a: 0,
      cue: 'isn’t it のあと、最後の動詞と目的語。',
      line: 'It’s funny, isn’t it? We take a day a year to dress up in costume and *celebrate fear*.',
      said: '「おかしなものだ。年に一度、仮装して恐怖を祝う日がある」。',
      mean: 'funny ＝ 妙な・皮肉な。恐怖に支配されながら、それを祝う矛盾を指す。',
      trap: 'funny を「笑える」と取りやすい。直前の話（恐怖に動かされる）と最後の fear を結ぶ。',
      use: 'It’s funny how things work out.（物事って不思議とうまくいくね）' },
  ]
};
