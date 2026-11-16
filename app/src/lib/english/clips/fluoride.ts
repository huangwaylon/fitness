// “Leslie and Tom Sex Up Fluoride | Parks and Recreation” (the official Parks and Recreation channel, Season 6): after a
// scare ad on TV, Leslie snaps at callers about fluoride, then lets Tom rebrand it as a fun product.
// Segments from the captions, words from whisper (2026-11-16). Whisper drops the last stretch (161–193 s, the crowd and
// Tom's pitch) and hallucinates over it; nothing is built on that stretch. Speakers are named only where the audio names
// them (Leslie, Tom); the man on TV is not named in his own segment.
// REVIEW 2026-11-16: pass 9, fix 11, drop 0, new 0; ear checks 0
import type { Clip } from '../types.ts';

export const fluoride: Clip = {
  id: 'fluoride', video: '8c0JrJdJrBA', title: 'Leslie and Tom Sex Up Fluoride', dur: 214, wpm: 176,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: poison ← strychnine and cyanide follow, in the wrong relation; drug ← it's added to water to treat teeth
    { id: 'd1', skill: 'detail', level: 'B1', point: 'chemical', seg: [0.2, 9.95],
      stem: 'In the TV segment, what is fluoride called at the start?',
      choices: ['A chemical', 'A poison', 'A drug'], a: 0,
      cue: '「fluoride, which is」のあと。',
      line: 'fluoride, *which is a chemical*, into your drinking water.',
      said: '「レスリー議員は化学物質のフッ素を飲み水に入れたがっている」と言う。',
      mean: 'chemical ＝ 化学物質。わざとこの語を使い、怖いものに聞こえさせている。',
      trap: 'すぐあとに毒の名前が続くので「毒」と取りやすい。which is のあとの語をそのまま聞く。',
      use: 'Is there anything in this I’m allergic to?（これ、アレルギーのもの入ってますか）' },

    // R fix: the seg never names Leslie (she's named at 0.6 s), so "Call Leslie" needed audio outside it (S4/V1); the key now
    // names the role the seg describes
    // why: vote ← a call-in show script; questions ← "contact" read as asking the show
    { id: 'i1', skill: 'infer', level: 'B2', point: 'callnum', seg: [16.5, 27.2],
      stem: 'At the end of the TV segment, what are viewers being pushed to do?',
      choices: ['Call the person behind it to complain', 'Call in and vote on fluoride', 'Call the show with their own questions'],
      a: 0,
      cue: '「if you want to contact」の、だれに連絡するか。',
      line: 'if you want to contact the psychopath that wants to turn your kids… just *call the number*',
      said: '「子どもを変えようとしている人に連絡したいなら、画面下の番号へ」と言う。',
      mean: 'その人とはフッ素を水に入れたい人のこと。視聴者に苦情の電話をさせている。',
      trap: 'テレビで番号と言われると番組への電話と考えやすい。contact のあとのだれに、を聞く。',
      use: 'Just call the number on the website.（サイトにある番号に電話して）' },

    // R fix: "asking for their vote" was a filler (K3); now "apologizing", from her "sorry" on the last call
    // why: calmly explaining ← her first call does state a fact; apologizing ← "sorry" is said, but only to her mom
    { id: 'g2', skill: 'gist', level: 'B2', point: 'temper', seg: [28.7, 71.5],
      stem: 'How is Leslie handling the phone calls in this part?',
      choices: ['Losing her temper with the callers', 'Calmly explaining the facts to callers',
                'Apologizing to callers one by one'], a: 0,
      cue: '電話の相手への言い方と、まわりの反応。',
      said: 'レスリーは電話で事実を言うが、すぐ相手をばか呼ばわりし、注意されても続ける。',
      mean: 'いつもの丁寧な対応をやめ、感情のまま言い返している場面。',
      trap: '最初の一言は事実の説明なので、落ち着いていると取りやすい。そのあとの言い方の変化を追う。',
      use: 'Sorry, I lost my temper.（ごめん、カッとなった）' },

    // R fix: "protects your teeth" was world knowledge (V1/V2); the item now turns on "perfectly", which only the audio gives
    // why: small amounts ← the usual expert hedge, "perfectly" missed; once in water ← "into the water" said, in the wrong relation
    { id: 'd2', skill: 'detail', level: 'B1', point: 'healthy', seg: [28.7, 34.5],
      stem: 'On her first call, what does Leslie say about fluoride and health?',
      choices: ['It’s perfectly healthy for you', 'It’s healthy in very small amounts', 'It’s safe once it’s in water'], a: 0,
      cue: '「teeth」のあと、and に続く部分。',
      line: 'fluoride protects your teeth and it’s *perfectly healthy* for you.',
      said: '「フッ素は歯を守るし、体にもまったく問題ない」と言い切る。',
      mean: 'perfectly ＝ 完全に。条件を付けずに「害はない」と言い切っている。',
      trap: '「少量なら」「水に入れば」とは言っていない。強める語 perfectly を聞き落とさない。',
      use: 'It’s perfectly safe for kids.（子どもにもまったく安全です）' },

    // why: can ← the t of can't drops; could ← a softer guess at the weak vowel
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [40, 44.4],
      stem: 'Fill the gap: “You ___ do that.”',
      choices: ['can’t', 'can', 'could'], a: 0,
      cue: '「Whoa」で始まる注意の最後。返事もヒント。',
      line: 'You *can’t* do that. — Why not?',
      said: '「その言い方はだめ」と注意され「なんで？」と返す。',
      mean: 'can’t の t は消え、a が長く強い「キャーン」。can は弱く「クン」。',
      trap: 't が消えるので can と聞こえやすい。長い母音と、すぐあとの Why not? で否定と分かる。',
      use: 'You can’t park here.（ここには停められません）' },

    // R fix: seg started inside "can't" and ended 0.4 s after "senator" (S4); now 42.15–57.1
    // why: sorry ← being told "you can't do that" usually brings an apology; worried ← "kick me out of office" heard as a fear
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'free', reveals: ['cant'], seg: [42.15, 57.1],
      stem: 'When she’s told off for how she spoke, how does Leslie feel?',
      choices: ['Freed: nothing bad can happen to her', 'Sorry: she knows she went too far',
                'Worried: she might lose her job'], a: 0,
      cue: '「Why not?」のあと、自分に何が起きるかの話。',
      line: 'There are *no consequences* to my actions anymore.',
      said: '「もう何をしても悪いことは起きない」と気づく。',
      mean: 'What are they gonna do? は答えを求めない問いで、開き直りを表す。',
      trap: 'kick me out だけ聞くと心配に聞こえる。問いの形で言い返すときは、平気だという合図。',
      use: 'What’s the worst that could happen?（最悪でもどうなるっていうの）' },

    // why: cheering her on ← a mom on the line; hangs up ← "sorry" read as ending the call
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mom', seg: [58.3, 70.6],
      stem: 'Why is the next call funny?',
      choices: ['She keeps scolding, even after “sorry”', 'Her mom calls in to cheer her on',
                'She says sorry and hangs up right away'], a: 0,
      cue: '「Oh, hey」のあと、相手の呼び方と、その後の一言。',
      line: 'Oh, hey, mom, sorry. … God, *I expected more from you*.',
      said: '電話の相手が母親だと分かって謝るが、すぐ「がっかりだわ」と母親を叱る。',
      mean: '謝ったのに、母親にも同じ調子で説教を続ける。そのずれが笑いになる。',
      trap: 'sorry で話が終わったと思いやすい。謝ったあとにまだ話が続くかを最後まで聞く。',
      use: 'Honestly, I expected more from you.（正直、もう少し期待してたよ）' },

    // R fix: "ready to quit her job" was a filler (K3); now the literal reading of "cannon"
    // why: lost her power ← "loose" heard as "lose"; big weapon ← "cannon" read literally
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'loosecannon', reveals: ['free'], seg: [71.4, 75.6],
      stem: 'What does Leslie now call herself, in her plan to fight back?',
      choices: ['Someone wild and unpredictable', 'Someone who has lost her power', 'Someone with a big weapon to use'],
      a: 0,
      cue: '「All right, I’m a」のあとの2語。',
      line: 'All right, I’m a *loose cannon*.',
      said: '「よし、私は何をするか分からない人間よ」と宣言する。',
      mean: 'loose cannon ＝ 予測できない、危なっかしい人。ここでは楽しそうに名乗る。',
      trap: 'loose と lose（失う）は音も字も似ている。loose は「ゆるい、しばられていない」。',
      use: 'He’s a bit of a loose cannon.（あの人はちょっと何をするか分からない）' },

    // why: put it out ← fire = 火事, so stop it; cool down ← the calm option a Japanese frame prefers
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'fire', seg: [71.4, 75.6],
      stem: 'What does Leslie say they need to do now?',
      choices: ['Use the other side’s own methods', 'Stop the trouble before it spreads',
                'Wait until things cool down'], a: 0,
      cue: '「We need to」のあと、同じ語が2回。',
      line: 'We need to *fight fire with fire*.',
      said: '「目には目を、でいくしかない」と言う。',
      mean: 'fight fire with fire ＝ 相手と同じやり方でやり返す。ここでは派手な宣伝。',
      trap: 'fire を「火事」と取ると「消し止める」に聞こえる。同じ語が with でつながる形は「同じ手で」。',
      use: 'Sometimes you have to fight fire with fire.（時には同じ手でやり返すしかない）' },

    // R fix: the title ("Leslie and Tom Sex Up Fluoride") answered it (V2); both distractors now fit the title too
    // why: flashier binders ← her own yellow-binder plan; Tom with facts ← Tom does take the stage, but not with facts
    { id: 'g1', skill: 'gist', level: 'B2', point: 'fightback', reveals: ['rebrand', 'scared'], seg: [71.4, 160.5],
      stem: 'In the end, how does Leslie try to win people back?',
      choices: ['By letting Tom sell it in a fun new way', 'By making her own binders flashier',
                'By having Tom present the hard facts'], a: 0,
      cue: 'レスリーがだれに何を任せるか。',
      said: 'レスリーは最初は資料で戦うつもりだったが、名前と見せ方を変えるトムの案に任せる。',
      mean: '事実で説得するのをやめ、楽しい商品のように見せて気持ちを動かす作戦。',
      trap: '派手な黄色の資料の案が先に出るので、それで勝つと取りやすい。最後にだれが何をしたかを聞く。',
      use: 'Let’s try a different approach.（別のやり方でやってみよう）' },

    // R fix: "mocking Tom" was weak (K3), now "admits it's dull"; its key's “wild” gives away p1, so it reveals loosecannon
    // why: admits it's dull ← the plan's smallness heard as her own point; secret weapon ← "Boom!" taken at face value
    { id: 'h2', skill: 'humor', level: 'C1', point: 'tame', reveals: ['loosecannon'], seg: [75.3, 89.45],
      stem: 'Why does the audience laugh at Leslie’s town hall plan?',
      choices: ['Her “wild” plan is completely tame', 'She admits her plan is a little dull',
                'The binders are her secret weapon'], a: 0,
      cue: '「but now」のあとの変化と、「Boom!」。',
      line: '…but now the binders are *bright yellow*. Boom!',
      said: '集会を開いて資料を配る、ただし今度の資料は真っ黄色、と得意げに言う。',
      mean: '「何をするか分からない」と言った直後の案が、資料の色を変えるだけ。その小ささが笑い。',
      trap: 'Boom! の勢いで大胆な作戦に聞こえる。言葉の勢いと中身の大きさを比べる。',
      use: 'I tried something new. Boom!（新しいことやってみた。どうだ）' },

    // why: agrees ← "too" heard as agreeing with "too extreme"; no opinion ← "nothing" read as "I have nothing to say"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'tame', seg: [83.2, 89.45],
      stem: 'When Leslie asks if her plan is too much, what does the reply do?',
      choices: ['Says it isn’t bold at all', 'Agrees it goes a bit too far', 'Says he has no opinion on it'], a: 0,
      cue: '「Too extreme?」の形をまねた短い返事。',
      line: 'Too extreme? — *Too nothing*.',
      said: '「やりすぎ？」と聞かれ、「やりすぎどころか、何もない」と返す。',
      mean: '相手の言葉の形を借り、extreme を nothing に入れ替えた皮肉。全然大胆じゃない。',
      trap: 'Too が聞こえると「やりすぎ」に同意したと取りやすい。入れ替えた語の意味を聞く。',
      use: 'Too spicy? Not even close.（辛すぎ？ 全然）' },

    // R fix: the stem says fluoride "needs a new name", p3's key (N7); reveals rebrand
    // why: hard to say ← a long, odd word; boring ← "boring" is shouted later, in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'scared', reveals: ['rebrand'], seg: [89.3, 93.85],
      stem: 'Why does Tom say fluoride needs a new name?',
      choices: ['People are scared of it now', 'The word is too hard to say', 'Kids think the word is boring'], a: 0,
      cue: '「already ruined fluoride」のあとの一文。',
      line: 'Jamm’s already ruined fluoride. *Everyone’s scared of it*.',
      said: '「ジャムのせいでフッ素はもうだめ。みんな怖がってる」と言う。',
      mean: 'ruin ＝ 台無しにする。名前のイメージが悪くなった、ということ。',
      trap: 'boring はあとで聞こえる語なので選びやすい。ここで言う理由は直前の一文にある。',
      use: 'The rain ruined our picnic.（雨でピクニックが台無しになった）' },

    // R fix: its line shows "we rebrand", p3's point (N7); reveals rebrand
    // why: unsure ← "I mean" heard as hedging; bad news ← Japanese 実は as a softener
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['rebrand'], seg: [92, 96.1],
      stem: 'When Leslie asks what he means, what does the start of Tom’s answer do?',
      choices: ['Leads into a plainer version', 'Shows he isn’t sure yet', 'Softens a bit of bad news'], a: 0,
      cue: '答えの最初の2語と、そのあとの短い一語。',
      line: '*I mean*, we rebrand.',
      said: '「どういうこと？」と聞かれて、「つまり、名前を変えるんだ」と答える。',
      mean: 'この I mean は「つまり」。前の話をもっとはっきり言い直す合図。',
      trap: 'I mean を迷いの「えっと」と取りやすい。質問への答えの頭なら、言い直しが続く。',
      use: 'I mean, we could just take a taxi.（つまり、タクシーで行けばいいってこと）' },

    // R fix: "lower price" was a filler (K3); now the celebrity example read as the plan itself
    // why: new product ← "brand" heard as making a new brand of it; celebrity ← the singer read as the plan, not an example
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'rebrand', reveals: ['imean'], seg: [93.4, 108.35],
      stem: 'What is Tom suggesting, using the singer’s names as an example?',
      choices: ['Give it a new name and image', 'Make a new kind of fluoride', 'Get a celebrity to promote it'], a: 0,
      cue: '名前が次々に変わる例。何が変わり、何が同じか。',
      line: 'I mean, we *rebrand*. No one cared about Calvin Broadus until…',
      said: '本名では注目されなかった歌手が、名前を変えるたびに話題になったと言う。',
      mean: 'rebrand ＝ 中身はそのまま、名前や見せ方を変える。re は「もう一度」。',
      trap: 'brand から新しい商品を作ると考えやすい。例の歌手は同じ人のまま名前だけ変わっている。',
      use: 'The café rebranded and got busier.（あのカフェは店名を変えて客が増えた）' },

    // why: twelve, twenty ← -teen/-ty and "ten" next to a quick "years"
    { id: 'n1', skill: 'number', level: 'B1', point: 'tenyears', seg: [103.1, 108.35],
      stem: 'How far ahead does Tom imagine the singer’s next name?',
      choices: ['ten years', 'twelve years', 'twenty years'], a: 0, keep: true,
      cue: '「What’s he gonna be in」のあと。',
      line: 'What’s he gonna be in *ten years*?',
      said: '「10年後には何になってるかな」と、先の名前を想像する。',
      mean: 'in ten years ＝ 今から10年後。in は「〜のうちに」ではなく「〜後」。',
      trap: 'ten は短く、すぐ years が続く。twenty なら「トゥエニ」と2つの音に聞こえる。',
      use: 'Where do you see yourself in ten years?（10年後、何してると思う？）' },

    // why: most work ← "most" read as "work the most"; seriously ← a boss's usual advice
    { id: 'd4', skill: 'phrase', level: 'B2', point: 'makemost', seg: [113, 118.6],
      stem: 'What does Tom remind Leslie she once told him?',
      choices: ['To make full use of his job', 'To do the most work he can', 'To take the job more seriously'],
      a: 0,
      cue: '「You told me to」のあと。',
      line: 'You told me to *make the most of* my job. I’m good at this stuff.',
      said: '「仕事を生かせと言ったよね。得意なんだ」と言う。',
      mean: 'make the most of ＝ 最大限に生かす。得意を使わせてと頼んでいる。',
      trap: 'most を「一番たくさん」と取ると「たくさん働く」に聞こえる。make the most of で一つ。',
      use: 'Let’s make the most of the weekend.（週末を目いっぱい楽しもう）' },

    // R fix: "Fired up" overstated the key, and "too polite to say no" was defensible from the pause (K1); the distractor
    // now asks for time, which her "Yeah… Do your thing" refutes
    // why: time to think ← the pause before "Yeah" read as Japanese reluctance; joking ← the rhyme heard as not serious
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'goose', seg: [113, 125.9],
      stem: 'When Tom asks her the final question, how does Leslie answer?',
      choices: ['Won over, she lets him take charge', 'Unsure, she asks for time to think', 'Joking, without really agreeing'],
      a: 0,
      cue: '少し間があってからの返事と、最後の一言。',
      line: 'Yeah. I’m as loose as a goose. *Do your thing*, Tom.',
      said: '少し間をおいて「ええ。めちゃくちゃゆるいわよ。好きにやって、トム」と答える。',
      mean: 'Do your thing ＝ 君のやり方でやって。全部任せるという合図。',
      trap: '答えの前の間を、日本語のためらいと取りやすい。最後の一言が任せる言葉なら本気の同意。',
      use: 'Go ahead, do your thing.（どうぞ、好きにやって）' },

    // why: cold ← katakana ドライ = 冷たい; too short ← "a little" heard as "too little"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'dry', seg: [136.2, 142.4],
      stem: 'What does Tom suggest was wrong with the speech before his?',
      choices: ['It was boring to listen to', 'It was cold and unkind', 'It was too short to work'], a: 0,
      cue: '「councilman」のあとと、次の誘いの文。',
      line: 'That was *a little dry*. What do you say we *have some fun*, huh?',
      said: '「ちょっと退屈ですね。楽しいことしましょう」と言う。',
      mean: 'dry ＝ 話に面白みがない。次の have some fun との対比で意味が決まる。',
      trap: 'カタカナのドライは「冷たい」だが、話について言う dry は「退屈」。次の fun が手がかり。',
      use: 'The lecture was a little dry.（講義はちょっと退屈だった）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'stronger', seg: [154.6, 160.1],
      stem: 'Type what the ad says: “That water contains Teeth Dazzler, which ___.” (4 words)',
      answer: 'makes your teeth stronger',
      cue: '「which」のあと、and の前まで。', line: 'which *makes your teeth stronger*…',
      said: '「この水には歯を強くする成分が入っている」と宣伝する。',
      mean: 'make + 人・物 + 形容詞 ＝ 〜を…にする。宣伝でよく使う形。',
      trap: 'makes の s と your がつながり「メイクスュア」と一続きになる。teeth の th は息だけの音。',
      use: 'Coffee makes me feel awake.（コーヒーを飲むと目が覚める）' },
  ]
};
