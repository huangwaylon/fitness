// REVIEW 2026-11-16: pass 17, fix 6, drop 1 (a1), new 0; ear checks 1
// REVIEW question: d1 now reads "Same hairdresser" as the shared hairdresser being the go-between ("Damn it,
//   Typhoon!" then blames Typhoon); if the scene makes Typhoon someone else, the key wording needs another look
// “#BitchBoss | Parks and Recreation” (the official Parks and Recreation channel, Season 6): at a hearing, Donna's
// private posts about Leslie are read into the record; Leslie is hurt, older posts show Donna admires her, and the two
// make up with half-apologies, a deal and matching lipsticks.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈258 s (music after; whisper loops "I don't
// hate that" to the end). Left out on purpose: the hashtags and every line with the B-word (77.9–81.1, 189.4–190.6,
// 195.9–205.9, 252.1–254.7 s), the lawsuit opening (14.9–26.2 s), "tweet nasty stuff…" (130.1–132.5 s), and the
// backstory names (the recall, Jamm, Typhoon). No stem, choice, line or note quotes those; f2 stops at 130.1 s, and a3
// starts at 254.7 s with almost no lead-in so that it doesn't replay the hashtag. Speakers who aren't named in the audio
// stay unnamed in the stems ("the questioner", "the reply").
// EAR CHECK: 90.2–92.3 s nt1 — both sources have "you know it ain't less than 98"; confirm "ain't" (no "isn't") before
//   the C2 dictation keys on it
import type { Clip } from '../types.ts';

export const donnaPosts: Clip = {
  id: 'donnaposts', video: 'mky1433VH-k', title: '#BitchBoss', dur: 278, wpm: 166, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R drop: a1 (V1 + K1). That the praise is a dig rests on what the hearing is about, which the segment never
    //   says (Donna's own defence comes after the lawsuit lines left out at 14.9–26.2 s), and "let me first say…"
    //   before questions is just as defensible as a softener; its tone ear check goes with it
    // R fix: V2 (blind 50 %: "praise too" was weak); now a second "objecting" choice
    // why: show of hands ← "does anyone else here…?" taken as a real question to the room; waste of time ← the
    //   impatient "Okay, …" heard as the point, "double standard" missed
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'double', seg: [6.5, 14.9],
      stem: 'When Leslie speaks up after the praise, what is her question doing?',
      choices: ['Objecting that Donna is treated unfairly', 'Calling for a show of hands from the room',
                'Objecting that the hearing is a waste of time'], a: 0,
      cue: 'anyone else のあと、最後の二語。',
      line: 'Okay, does anyone else here see a *double standard*?',
      said: '「ほかに、二重基準だと思う人はいない？」と割って入る。',
      mean: '答えを求める質問ではなく抗議。なぜ彼女だけが責められるのか、という意味。',
      trap: 'does anyone…? を本当の質問と取りやすい。会議で周りに問いかける形は、反対の意思表示に多い。',
      use: 'Isn’t that a bit of a double standard?（それってちょっと不公平じゃない？）' },

    // R fix: K1 ("Same hairdresser" answers "via a third party": the go-between is the shared hairdresser, not
    //   someone who shares it, which would be the questioner himself); the key now says so
    // why: reporter ← "shocking twist… juicy story" sounds like a newscaster; coworker ← "the Parks Department" came
    //   just before, the office-leak script; "Same hairdresser" answers it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'thirdparty', seg: [37.2, 48.5],
      stem: 'How did the questioner get into Donna’s private account?',
      choices: ['Through the hairdresser they both go to', 'Through a reporter chasing after a juicy story',
                'Through a coworker in her own department'], a: 0,
      cue: 'third party のあとの、短い答え。',
      line: 'via a *third party*. — *Same hairdresser.*',
      said: '「第三者を通じてアカウントを見た」と言い、「同じ美容師」と補う。',
      mean: '二人が通う同じ美容師を通じて、非公開の投稿を見た、ということ。',
      trap: 'juicy story（おいしいネタ）で記者を思い浮かべやすい。third party の正体は直後の短い答え。',
      use: 'I heard it from a mutual friend.（共通の友人から聞いた）' },

    // why: posts about them ← the whole hearing is about posts, so the motive sounds like one too; truth ← a
    //   public-spirited script; the reply names only the brunch she didn't come to
    { id: 'i2', skill: 'infer', level: 'B2', point: 'brunch', seg: [48.4, 55.3],
      stem: 'Why did the person who passed on Donna’s posts do it?',
      choices: ['To get back at Donna for missing a party', 'To get back at Donna for posts about them',
                'To help the hearing find out the truth'], a: 0,
      cue: 'Why’d you do this? への返事、if のあと。',
      line: 'Maybe if you’d *bothered to come* to my … *brunch*, you’d know.',
      said: '「なんで？」に「私のブランチに来てくれてたら、分かったでしょうね」と返す。',
      mean: '仕返しの理由は、パーティーに来なかったこと。bothered to で責めている。',
      trap: '投稿の話の流れで、理由も投稿だと思いやすい。理由は if のあとにある。',
      use: 'You didn’t even bother to call.（電話もくれなかったじゃない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'brunch', seg: [51.3, 55.3],
      stem: 'Type the words: “Maybe if ___ come to my … brunch…” (3 words)', answer: "you'd bothered to",
      cue: 'Maybe if のすぐあと、come の前。',
      line: 'Maybe if *you’d bothered to* come to my … brunch, you’d know.',
      said: '「ブランチに来る手間さえかけてくれてたら」。d は弱く短い。',
      mean: 'you had bothered to の短縮。to は弱く、come につながる。',
      trap: 'd が聞こえにくく you bothered と書きやすい。if＋過去の話なら had が入る。',
      use: 'If you’d told me, I’d have come.（言ってくれたら来たのに）' },

    // why: kept private ← her account "is set to private" was said earlier; admitting ← the Japanese frame: "Uh-oh"
    //   heard as owning up before the bad news
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'recess', seg: [55.8, 64.4],
      stem: 'When the posts are about to be read out, what is Donna doing?',
      choices: ['Stalling, by asking for a short break', 'Asking that her posts be kept private',
                'Admitting that her posts went too far'], a: 0,
      cue: 'Uh-oh のあと、Can I で始まる頼み。',
      line: '*Uh-oh.* Can I request a *brief recess*?',
      said: '「あーあ」とつぶやき、「少し休憩をもらえますか」と頼む。',
      mean: 'recess は会議や裁判の休憩。読み上げを止めたくて、時間かせぎをしている。',
      trap: 'Uh-oh で謝る流れを予想しやすい。困った直後の頼みごとは、その場をしのぐ手が多い。',
      use: 'Can we take a short break?（少し休憩しませんか）' },

    // R fix: V2 (blind 65 %: "turn the council against Donna alone" was weak); now an embarrass-and-apologize
    //   script, refuted by Leslie's "I honestly don't know anymore" ending the exchange
    // why: fired ← "fire you" is said just before the reading; apologizes at once ← the usual sitcom script after a
    //   leak; "the respect of your employees" and "That's what you really think of me?" settle it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'hearing', reveals: ['target'], seg: [55.8, 139.2],
      stem: 'What do the posts read at the hearing do to Leslie and Donna?',
      choices: ['They hurt Leslie and shake their trust', 'They get Donna fired from the department',
                'They embarrass Donna, who apologizes at once'], a: 0,
      cue: '読み上げのあと、二人のやりとりの最後まで。',
      said: '投稿が読まれ、Leslie は「そう思ってたの？」と傷つく。',
      mean: '責められるのは Leslie の管理能力。それ以上に、二人の信頼が揺らぐ。',
      trap: '「クビ」が先に出るので、Donna の処分の話と思いやすい。読み上げのあとの会話で決まる。',
      use: 'I honestly don’t know anymore.（正直、もう分からない）' },

    // why: can't stop it ← "not me I'm worried about" heard as doubt in Leslie's promise; rather quit ← "not me" heard
    //   as "I don't care about this job"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'target', seg: [64.0, 70.0],
      stem: 'What does Donna’s reply to Leslie’s promise suggest?',
      choices: ['The posts will hurt Leslie more than her', 'Leslie can’t really stop them firing her',
                'She’d rather quit than wait to be fired'], a: 0,
      cue: 'fire you への返事。誰の話か、主語に注目。',
      line: 'I’m not going to let them *fire you*. — Yeah, *it’s not me* I’m worried about.',
      said: '「クビにはさせない」に「心配なのは私じゃないの」と返す。',
      mean: '心配なのは、これから投稿を聞かされる Leslie のほう。',
      trap: '「クビ」の話が続くので、自分の進退の話と取りやすい。it’s not X は「Xでなく別の人」を指す。',
      use: 'It’s not the money I’m worried about.（心配なのはお金じゃない）' },

    // why: 90 ← the weak "-eight" of ninety-eight is lost; 88 ← eighty/ninety blur in fast reading
    { id: 'n1', skill: 'number', level: 'B1', point: 'poll', seg: [81.5, 93.3], keep: true,
      stem: 'In the poll, what scale is offered for how annoying Leslie is?',
      choices: ['88 to 100', '90 to 100', '98 to 100'], a: 2,
      cue: 'scale of のあと。あとで同じ数がもう一度出る。',
      line: 'Twitter poll on a scale of *98 to 100*.',
      said: '「ツイッター投票：98から100のスケールで」と読み上げる。',
      mean: 'scale of A to B ＝ AからBの段階で。下の数の高さに注目。',
      trap: 'eight は短く弱く、ninety だけに聞こえやすい。あとの less than 98 で確かめる。',
      use: 'On a scale of one to ten?（10段階でいうと？）' },

    // R fix: V2 (blind 75 %: "numbers too large" didn't sound like a joke at all); now a reversed-scale misreading
    // why: TV fans ← "true blood fans" is read right after; scale mixed up ← "98 to 100" plus "less than 98" heard as
    //   a scale that runs the wrong way
    { id: 'h1', skill: 'humor', level: 'C1', point: 'poll', reveals: ['aint'], seg: [81.5, 93.3],
      stem: 'What makes the poll Donna posted a joke?',
      choices: ['Even its lowest choice means “very annoying”', 'It asks TV fans to judge a city official',
                'It mixes up the top and bottom of the scale'], a: 0,
      cue: '二つの数の差と、最後の less than。',
      line: 'on a scale of *98 to 100*… you know it *ain’t less than 98*.',
      said: '98から100で「どれだけうざいか」を聞き、「98より下はないでしょ」と添える。',
      mean: '選べるのは「すごくうざい」だけ。投票の形で、答えを最初から決めているのが笑い。',
      trap: '数字の向きや TV ファンに気を取られやすい。数字のジョークは、範囲の幅を見る。',
      use: 'Choose any time, as long as it’s noon.（何時でもいいよ、正午なら）' },

    // C2: exact words in fast speech (non-standard "ain't")
    // anchor: 90.24–92.32 s both sources have "you know it ain't less than 98" (captions "cause", whisper "Because"
    //   before it), seven words in ≈2.1 s (≈200 wpm); grammar would write "isn't"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'aint', reveals: ['poll'], seg: [87.6, 93.3],
      stem: 'Type the words: “…you know ___ 98.” (4 words)', answer: "it ain't less than",
      cue: 'you know のすぐあと。文法より、聞こえた音を。',
      line: 'Because you know *it ain’t less than* 98.',
      said: '「だって98より下なわけないでしょ」と読む。4語がひと続きに聞こえる。',
      mean: 'ain’t は isn’t のくだけた形。標準ではないが、ふざけた投稿の口調をそのまま読んでいる。',
      trap: '習った形に合わせて isn’t と書きたくなる。書き取りは、正しい文でなく言われた音を書く。',
      use: 'It ain’t over yet.（まだ終わっちゃいないよ）' },

    // R fix: V2 (blind 55 %: the key was the only "respect"); a distractor now shares it
    // why: council ← the hearing is held by the council, and "respect" is caught; town ← a "public trust" script for
    //   a city official
    { id: 'd2', skill: 'detail', level: 'B1', point: 'respect', seg: [102.2, 109.8],
      stem: 'Besides control of her department, what does Leslie lack, says the questioner?',
      choices: ['The respect of her own employees', 'The respect of the council members', 'The trust of the people in town'], a: 0,
      cue: 'Not only のあと、don’t even に続く部分。',
      line: 'Not only do you have no control over your department, you don’t even have *the respect of your employees*.',
      said: '「部署を管理できていないだけでなく、部下に尊敬すらされていない」と言う。',
      mean: 'not only A, even B で、B のほうをより強く責めている。',
      trap: '公聴会の場なので、議会や町の人の話と思いやすい。don’t even のあとの名詞まで聞く。',
      use: 'Not only is it cheap, it’s good.（安いだけじゃなく、おいしい）' },

    // why: it was ← "that" after "thought" loses its th and sounds like "it"; that's ← "that was" runs into one
    //   syllable; think that's ← the -ght of "thought" drops before "that"
    { id: 's1', skill: 'sound', level: 'B2', point: 'thing', seg: [109.7, 115.0],
      stem: 'Fill the gap: “I mean, I ___ your thing.”',
      choices: ['thought it was', 'thought that was', 'thought that’s', 'think that’s'], a: 1,
      cue: 'I mean のあと、your の前の短い音。',
      line: 'I mean, I *thought that was* your thing.',
      said: '「それがあなたの持ち味だと思ってた」。thought that がつながる。',
      mean: 'thought の t と that の th が重なり、一続きに聞こえる。',
      trap: 'that が弱いと it に聞こえやすい。was まで聞く。',
      use: 'I thought that was tomorrow!（それ明日だと思ってた！）' },

    // why: job ← "thing" read as 担当 ("that's my thing" = my job); problem ← "your thing" heard as "your issue"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'thing', seg: [109.7, 117.0],
      stem: 'How does Donna explain that calling Leslie annoying isn’t an insult?',
      choices: ['It’s Leslie’s trademark, part of her style', 'It’s Leslie’s job, as the one in charge',
                'It’s Leslie’s problem, and not anyone else’s'], a: 0,
      cue: 'I mean のあと、your で終わる一言。',
      line: 'sometimes you’re kind of annoying. I mean, I thought that was *your thing*.',
      said: '「ちょっとうざい時もある。それが持ち味だと思ってた」と言う。',
      mean: 'your thing ＝ その人らしさ。悪口ではなく、キャラの一部として言っている。',
      trap: 'thing を「仕事」や「問題」と取りやすい。your thing は「その人らしさ」。',
      use: 'Karaoke isn’t really my thing.（カラオケはあまり得意じゃない）' },

    // why: surprise parties / thank-you notes ← the kind of upbeat, crafty things such a person would list (the
    //   script); only the list's words settle it
    { id: 'd3', skill: 'detail', level: 'B1', point: 'list', reveals: ['thing'], seg: [114.6, 126.5],
      stem: 'Which does Leslie name as one of her real “things”?',
      choices: ['Thinking up cool nicknames for friends', 'Planning surprise parties for friends',
                'Writing long thank-you notes to friends'], a: 0,
      cue: 'My things are のあと、並ぶものの最後。',
      line: 'My things are making friendship bracelets… *thinking up really cool nicknames* for my friends.',
      said: '「私らしいのは、友情ブレスレット作りや、友だちに最高のあだ名を考えること」と並べる。',
      mean: 'うざさではなく、人を喜ばせることが自分の持ち味だ、と言い返している。',
      trap: 'いかにも言いそうな事を思い浮かべて選びやすい。並べた物を最後まで聞く。',
      use: 'My thing is cooking for friends.（友だちに料理するのが好きなの）' },

    // why: short break ← "blow off" read as skipping (blow off work = サボる); work news ← "about work" heard as the
    //   usual reason a city worker posts
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'steam', seg: [126.2, 130.1],
      stem: 'Why is Donna on Twitter at all, by her own account?',
      choices: ['To let off the stress her job builds up', 'To take a short break from work now and then',
                'To keep people posted on what’s new at work'], a: 0,
      cue: 'Twitter のあと、about work の前。',
      line: 'the only reason I’m even on Twitter is to *blow off steam* about work…',
      said: '「ツイッターは仕事のうっぷん晴らしのため」と言う。',
      mean: 'blow off steam ＝ たまった不満を吐き出す。本気で憎んではいない、という言い分。',
      trap: 'blow off は「サボる」にも使うので休憩と取りやすい。steam が付けばうっぷん晴らし。',
      use: 'I go running to blow off steam.（うさ晴らしに走るんだ）' },

    // why: worn out ← four quick answers heard as giving up; lies ← Leslie's "So you do think I'm annoying?" taken as
    //   the right reading of the "Yes" (it answers "right now" only)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'yes', seg: [153.2, 162.3],
      stem: 'In Leslie’s run of yes-or-no questions, why is the last answer funny?',
      choices: ['Her nonstop questions are what’s annoying him', 'He’s worn out and just agrees to anything',
                'He finally admits his first answers were lies'], a: 0,
      cue: '4つめの質問の、最後の二語。',
      line: 'Do you think I’m being annoying *right now*? — *Yes.*',
      said: '三つの質問に「ノー」、「今うざい？」にだけ「イエス」。',
      mean: 'うざいのは性格ではなく、今この質問攻め。答えそのものが、質問の答えになっている。',
      trap: '「イエス」で前の答えをひっくり返したと取りやすい。何に対するイエスかは、right now で決まる。',
      use: 'Am I talking too much right now?（今しゃべりすぎてる？）' },

    // why: denies ← "because they love you" is said and sounds like the answer; sidesteps ← the long praise ("you ask a
    //   lot… they love you") heard as the whole answer, missing the "But… ruffle some feathers" that follows
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'feathers', seg: [159.9, 174.1],
      stem: 'How does the reply to “So you do think I’m annoying?” handle it?',
      choices: ['It softens it: she pushes people very hard', 'It denies it: people love to work for her',
                'It sidesteps it: he praises her and stops there'], a: 0,
      cue: 'but のあと、driving people に続く部分。',
      line: 'people do what you ask *because they love you*. *But*… driving people as hard as you do can *ruffle some feathers*.',
      said: '「みんな君が好きで従う。でも追い立てすぎると反感も買う」と言う。',
      mean: 'annoying とは言わず、ほめてから but で本音を言う。',
      trap: 'love you が聞こえると否定に聞こえやすい。ほめ言葉のあとの but に本音が来る。',
      use: 'I don’t want to ruffle any feathers.（波風を立てたくないんだ）' },

    // why: hurt beside her ← "bullet" taken literally (撃たれる); hitting back ← "stepping up" heard as going on the
    //   attack; "for me" makes it taking harm in her place
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'bullet', seg: [191.8, 195.6],
      stem: 'In one of Donna’s older posts, what is Leslie doing for her?',
      choices: ['Taking the heat so that Donna stays safe', 'Getting hurt while fighting next to Donna',
                'Hitting back at the people who attack Donna'], a: 0,
      cue: 'at these hearings のあと、for me の前。',
      line: 'Leslie Knope is *stepping up* at these hearings and *taking a bullet for me*.',
      said: '「Leslie は公聴会で私の身代わりになってる」という投稿。',
      mean: 'take a bullet for ＝ 人の代わりに責めを受ける。本音は感謝。',
      trap: 'bullet（弾）を文字通りに取ると、けがやけんかの話になる。for me が付けば「身代わり」。',
      use: 'Thanks for taking the heat for me.（かばってくれてありがとう）' },

    // R fix: V2 (blind 60 %: "blames Donna" was weak); now a scope misreading of "one person's annoying"
    // why: fully sorry ← "I'm sorry if I can be…" taken as a full apology (the Japanese すみません frame); only Donna
    //   ← "one person's annoying" heard as a count (one person thinks so), not a change of label
    { id: 'a5', skill: 'attitude', level: 'C1', point: 'heroic', seg: [210.3, 220.2],
      stem: 'How sorry does Leslie sound in her apology for being annoying?',
      choices: ['Half sorry: she turns the flaw into a strength', 'Fully sorry: she admits she needs to change',
                'Half sorry: she says only Donna finds her so'], a: 0,
      cue: 'I’m sorry のあと、but に続く部分。',
      line: 'I’m sorry if I can be a little annoying… *but* one person’s annoying is *another person’s inspiring and heroic*.',
      said: '「うざかったらごめん。でも、うざいは見方を変えれば英雄的」と言う。',
      mean: 'sorry if は条件つきの謝罪。欠点を長所に言いかえ、半分は自己弁護。',
      trap: 'sorry を聞くと全面的な謝罪と取りやすい。sorry if… but は「言い分もある」の形。',
      use: 'Sorry if I was rude earlier.（さっき失礼だったらごめん）' },

    // why: Leslie eases off ← her "I'm sorry if I can be a little annoying" heard as a promise; Donna quits posting ←
    //   the posts caused the trouble, and "Are you tweeting this?" keeps posts in view; the two "I can't promise…"
    //   lines and "Deal." settle it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'end', reveals: ['heroic', 'some'], seg: [210.3, 258.4],
      stem: 'How do Leslie and Donna settle things at the end?',
      choices: ['They make up, and neither promises to change', 'They make up, and Leslie vows to ease off',
                'They make up, and Donna quits posting'], a: 0,
      cue: '二人の I can’t promise… のあとの一語。',
      said: '二人とも謝るが「変わる約束はできない」と言い、手を打つ。',
      mean: 'お互い今のままでいることを認め合う仲直り。',
      trap: '謝ったら直す約束、という型で読みやすい。I can’t promise… を最後まで聞くと、約束していない。',
      use: 'Let’s agree to disagree.（意見の違いは認め合おう）' },

    // C2: what's withheld (cf. g1)
    // anchor: 220.34–223.22 s "I'm sorry for writing those things", then 223.62–224.70 s "Some of those things."
    //   narrows the apology; 230.26–232.56 s "I can't promise that I won't complain about it" confirms she keeps her view
    // why: someone else wrote them ← "some" heard as splitting who wrote the posts (scope shift), though she says
    //   "sorry for writing"; not sorry at all ← the narrowing heard as taking the whole apology back (too far)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'some', seg: [220.05, 233.0],
      stem: 'When Donna adds “Some of those things”, what is she not saying out loud?',
      choices: ['That she still means part of what she wrote', 'That someone else wrote the rest of the posts',
                'That she isn’t sorry for any of the posts'], a: 0,
      cue: '謝ったすぐあと、範囲をせばめる一言。',
      line: 'I’m sorry for writing those things. … *Some of* those things.',
      said: '「ああいうことを書いてごめん」と言ってから、「一部はね」と付け足す。',
      mean: '謝る範囲を「一部」にせばめると、残りは今も本気だという意味になる。あとの「文句は言うかも」がそれを裏づける。',
      trap: 'some を「書いた人が別」や謝罪の取り消しと取りやすい。言い直しは、何を外したかを聞く。',
      use: 'I liked the movie. Parts of it.（映画、よかったよ。一部はね）' },

    // why: one at a time ← "open each one… individually" comes right after; shopping ← "favorite lipsticks and nail
    //   polishes" heard as a plan to buy them
    { id: 'd4', skill: 'detail', level: 'B1', point: 'present', seg: [234.2, 243.5],
      stem: 'What is the schedule Leslie printed out for?',
      choices: ['So they wear the same makeup at the same time', 'So Donna can open the gifts one at a time',
                'So they can go shopping for makeup together'], a: 0,
      cue: 'schedule のあと、so に続く部分。',
      line: 'I got *the same ones*, too. I printed out a schedule *so we can wear them at the same time*.',
      said: '「同じ物を自分にも買った。同時につけられるように予定表も印刷した」と言う。',
      mean: '仲直りのしるしに、おそろいの化粧を同じ日にする計画。',
      trap: 'あとで each one と言うので、一つずつ開ける話と混ざりやすい。so のあとで目的を聞く。',
      use: 'Let’s wear matching shirts tomorrow.（明日おそろいのシャツを着よう）' },

    // why: unhappy ← "don't hate" read literally as reluctant acceptance (the negative form heard as a complaint);
    //   hurt ← "psycho" heard as an insult that stings
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'hate', seg: [254.7, 258.4],
      stem: 'How does the clip’s last line show she feels about the new hashtag?',
      choices: ['Pleased, though she says it in a low-key way', 'Unhappy, though she says she can live with it',
                'Hurt, though she says it as a joke'], a: 0,
      cue: '最後の一言。否定の形に注目。',
      line: '…it’s *psycho boss*. — *I don’t hate that.*',
      said: '新しいハッシュタグ案「サイコ・ボス」に、「それ、嫌いじゃない」と返す。',
      mean: 'I don’t hate that ＝ 控えめな「いいね」。',
      trap: '否定の形を、しぶしぶの了承と取りやすい。I don’t hate… は、たいてい好意。',
      use: 'Pizza for dinner? I don’t hate that.（夕飯ピザ？悪くないね）' },
  ]
};
