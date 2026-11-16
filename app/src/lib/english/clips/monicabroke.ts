// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// REVIEW open: f2 is still near the line on a cold read (a broke learner's common sense says "spend"); g1 rests on
//   the title's "broke" less, but rent is still the most direct money worry
// “Monica Is Broke | Friends” (the official Friends channel, Best of Season 2): out of work after a bad interview,
// Monica turns down a loan, is told to borrow from her parents, finds them turning her room into a gym, admits at
// dinner that she was let go (her dad says she has savings), and finally takes a loan paid in dinosaur checks.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Monica (13.2 s, 106.5 s), Jack
// (91.1 s), Judy (130.9 s); Ross only as "Ross's room" and "your brother". The lender at 13–29 s and 155–175 s is never
// named, so stems say "the lender" or "the suggestion" and no key rests on who it is.
// Untested on purpose: 64–75 s (Steffi Graf's "tush": the point is the body); 78–89 s (Carol and Susan, "a woman in my
// office is a lesbian": backstory); 90–94 s (the TV ad); 132–136 s ("our little harmonica": a pet-name pun); 151 s
// ("Anything larger back there?": who says it and to whom isn't clear); 176–188 s (the bathing suit and the
// Connecticut joke: a jab at her old weight). Small splits no key rests on: 22 s captions "why don't you why don't
// you", whisper "why don't you want you"; 183 s "bigger then" (captions) / "than" (whisper).
// EAR CHECK: 17.3 s s1 d1 — "couldn't" (both sources): said with the t dropped, ending on the n (≈ "couldn")
// EAR CHECK: 8.0 s x2 — "do you have any" (both sources): do you runs into one weak syllable, have any linked
import type { Clip } from '../types.ts';

export const monicabroke: Clip = {
  id: 'monicabroke', video: 'M0ULTq0P788', title: 'Monica Is Broke', dur: 200, wpm: 132, band: 'slow',
  tags: ['家', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right). The title "Monica Is Broke" pointed at the only money choice; all three are about
    //   money or family now
    // why: owes a friend ← "pay you back" + "guilty" heard as a debt she already has, not a loan she's refusing;
    //   telling parents ← "mom and dad… guilty and tense around them" comes at the end of the same scene
    { id: 'g1', skill: 'gist', level: 'B1', point: 'rent', reveals: ['possib'], seg: [1.5, 29.4],
      stem: 'At the start, what is Monica’s main worry?',
      choices: ['Not having the money for this month’s rent', 'Feeling guilty about money she owes a friend',
                'Telling her parents she lost her job'], a: 0,
      cue: '「ほかの当ては？」と聞かれたあとの答え。',
      line: 'Well, there is a *possibility that I won’t make rent*.',
      said: '面接が終わったあと、「家賃が払えないかも」と言っている。',
      mean: 'make rent ＝ 家賃を期日までに用意する。お金の心配が、この場面の出発点。',
      trap: 'guilty は借りたらの「もしも」で、借金はまだない。両親の話は相手が最後に出すだけ。',
      use: 'I might not make rent this month.（今月の家賃、払えないかも）' },

    // why: fifteenth ← fifth and fifteenth share "fif-" and the -th; fourth ← the same f onset and -th ending
    { id: 'n1', skill: 'number', level: 'B1', point: 'shower', seg: [3.1, 6.2], keep: true,
      stem: 'Which shower does Monica say finally got the interview off her?',
      choices: ['Her fourth', 'Her fifth', 'Her fifteenth'], a: 1,
      cue: 'shower の直前の短い語。',
      line: 'I think that *fifth shower* actually got the interview off me.',
      said: '「5回目のシャワーで、やっと面接が落ちた気がする」と言う。',
      mean: '面接がよほど嫌だったので、何度も洗い流したという大げさな冗談。',
      trap: 'fifth と fifteenth は出だしが同じ。fifteenth なら -teen の長く強い音が入る。',
      use: 'This is my third coffee today.（今日これで3杯目）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'anyother', seg: [7.3, 10.0],
      stem: 'Type the question: “So, ___ other possibilities?” (4 words)', answer: 'do you have any',
      cue: 'So のあと、弱くつながる4語。',
      line: 'So, *do you have any* other possibilities?',
      said: '「ほかに当てはあるの？」と聞いている。',
      mean: 'do you は「ジュ」に近く縮み、have any は「ハヴェニ」とつながる。',
      trap: 'do you が一音に聞こえ、Have you any や Are there any と書きやすい。語数で確かめる。',
      use: 'Do you have any other sizes?（ほかのサイズ、ありますか）' },

    // R fix: V2 (blind 60 %, right) and K6: "at all" was the only absolute, and the key was the odd one out. Both
    //   distractors now tie a lead to the rent/possibility words
    // why: low pay ← "possibility" heard as a job option, and "rent" heard right after it; won't discuss ← her joke
    //   read as dodging the question
    { id: 'i1', skill: 'infer', level: 'C1', point: 'possib', reveals: ['rent'], seg: [7.3, 13.0],
      stem: 'From Monica’s reply about her options, what can we tell?',
      choices: ['She has no job leads, only a bill coming due', 'She has a lead, but the pay won’t cover rent',
                'She has leads, but won’t discuss them now'], a: 0,
      cue: '「Oh, yeah. Well」のあと、何の可能性か。',
      line: 'Oh, yeah. Well, there is *a possibility that I won’t make rent*.',
      said: '「ほかの可能性？あるよ、家賃が払えない可能性がね」と答える。',
      mean: '仕事の当ては一つもない、ということを冗談で伝えている。',
      trap: 'Oh, yeah と a possibility で「当てがある」と思いやすい。何の possibility かまで聞く。',
      use: 'Plans tonight? Well, there’s laundry.（今夜の予定？まあ、洗濯ならあるけど）' },

    // R fix: V2 (blind 55 %, right), K3: "brags… lots of job offers" was absurd. Now an upbeat-then-giving-up reading
    // why: mishears ← the answer doesn't fit a jobs question, so a mishearing seems likely; upbeat ← "Oh, yeah" sounds
    //   like a confident yes before the letdown
    { id: 'h1', skill: 'humor', level: 'C1', point: 'possib', reveals: ['rent'], seg: [7.3, 13.0],
      stem: 'Why does Monica’s answer about other possibilities get a laugh?',
      choices: ['She uses “possibility” for a bad outcome, not a hope', 'She mishears “possibilities” as a question on rent',
                'She sounds upbeat, then admits she quit looking'], a: 0,
      cue: '同じ単語が、質問と答えでどう使われるか。',
      line: 'Oh, yeah. Well, there is *a possibility that I won’t make rent*.',
      said: '「ほかの可能性は？」に「家賃が払えない可能性ならある」と返す。',
      mean: '良い意味の possibilities を、悪い可能性にすり替えたのが笑い。',
      trap: '聞き違えたのではなく、わざと言葉を拾って遊んでいる。Oh, yeah は皮肉の前置き。',
      use: 'Good news? Well, it can’t get worse.（いい知らせ？まあ、これ以上悪くはならないよ）' },

    // why: could ← the -n't's t drops, so only a faint n is left; can't ← the same "k-n" frame, a vowel apart;
    //   didn't ← a weak d-n syllable in the same slot
    { id: 's1', skill: 'sound', level: 'B2', point: 'couldnt', reveals: ['guilty'], seg: [15.4, 20.6],
      stem: 'Fill the gap: “cuz if I ___ pay you back right away…”',
      choices: ['could', 'couldn’t', 'can’t', 'didn’t'], a: 1,
      cue: 'if I のすぐあと、短い一語の終わり方。',
      line: 'cuz if I *couldn’t* pay you back right away, then I’d feel guilty',
      said: '「すぐに返せなかったら、気まずくなる」と言う。',
      mean: 'couldn’t の t はほぼ消え、「クドゥン」と n で止まる。仮の話なので過去形。',
      trap: 'could だと「返せたら気まずい」と話が逆になる。最後の n の響きと意味の流れで決める。',
      use: 'If I couldn’t come, I’d call you.（来られなかったら電話するね）' },

    // R fix: V2 (blind 70 %, right). The key was the only reason about feelings; "pride" is a feelings reason too, and
    //   "job soon" was weak
    // why: parents ← mom and dad come up right after, as the other person's idea; pride ← "every time I saw you"
    //   heard as embarrassment at being seen broke
    { id: 'd1', skill: 'detail', level: 'B1', point: 'guilty', reveals: ['couldnt'], seg: [15.4, 21.0],
      stem: 'Why does Monica turn down the offer of a loan?',
      choices: ['She’d feel awkward if she was slow to repay it', 'She would rather ask her parents for the money',
                'She is too proud to let a friend see her broke'], a: 0,
      cue: '「No, no, no」のあと、「もし〜なら」の部分。',
      line: 'if I *couldn’t pay you back right away*, then I’d *feel guilty and tense*',
      said: 'すぐに返せなかったら、会うたびに気まずくなる、と断っている。',
      mean: 'お金の貸し借りで、相手との関係がぎくしゃくするのを避けたいという理由。',
      trap: 'mom and dad は相手があとで出す話。見栄ではなく、返せないときの気まずさが理由。',
      use: 'I don’t want things to get weird.（気まずくなりたくないの）' },

    // anchor: 24.4–25.9 s "guilty and tense" are Monica's own words from 18.9–19.4 s, now pinned on her and her parents
    //   ("around them already"); the loan offer itself was made in earnest at 13.2 s
    // R fix: V2 (blind 55 %, right), K6: "always" was an absolute in the key only. The lender distractor now points
    //   at the refused offer, and the parents one at an easy source of cash
    // why: parents ← "make some money off of them" sounds like a dig at a soft touch; the lender ← "Oh, okay" after
    //   her refusal, heard as the joke being on the turned-down offer
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'already', seg: [21.5, 29.4],
      stem: 'In the suggestion to borrow from her parents, who is the joke on?',
      choices: ['Monica, whose guilt around her parents is old news', 'Her parents, who would be an easy source of cash',
                'The lender, whose offer she has just turned down'], a: 0,
      cue: '本人の言葉が、誰についてくり返されるか。',
      line: 'You *feel guilty and tense around them already*. You might as well make some money off of them.',
      said: '断る理由の「気まずくなる」を使い、「親の前ではもう気まずいんだから借りれば」と言う。',
      mean: '彼女自身の言葉を親との関係に当てはめて、からかっている。笑われるのは Monica。',
      trap: 'money off of them は親への悪口に聞こえやすい。誰の言葉のくり返しかを追うと、相手が分かる。',
      use: 'You’re late anyway, so grab a coffee.（どうせ遅刻なんだし、コーヒー買っていけば）' },

    // R fix: V2 (blind 60 %, right), K3: "just as good with money" was a filler. Now "make money off of them" read
    //   as earning it, and the key no longer echoes "feel bad"
    // why: small chance ← might = かもしれない, the literal reading; earn ← "make some money off of them" heard as
    //   earning money by working for them
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'already', seg: [21.5, 29.4],
      stem: 'In the last part of the suggestion about her parents, what is being said?',
      choices: ['She has nothing to lose by asking them for it', 'There is a small chance that they will pay',
                'She could earn some money by working for them'], a: 0,
      cue: '文の最後、might で始まるひとかたまり。',
      line: 'You *might as well* make some money off of them.',
      said: '「どうせ気まずいなら、お金ももらえば」という提案。',
      mean: 'might as well ＝ 損はないからそうすれば、という言い方。',
      trap: 'might を「かもしれない」、make money を「稼ぐ」と分けて取るとずれる。ひとかたまりで覚える。',
      use: 'We might as well walk.（どうせなら歩こうか）' },

    // R fix: V2 (blind 70 %, right). "Moving out" was weak; renting the room out is the other usual empty-nest plan
    // why: to Ross ← "Ross's room" comes up next, as if his room were the one moving; renting ← boxes of her old
    //   stuff mean the room is being cleared for someone
    { id: 'd2', skill: 'detail', level: 'B1', point: 'gym', seg: [39.1, 45.6],
      stem: 'What is the surprise her parents have for Monica?',
      choices: ['They are turning her room into a gym', 'They are clearing her room for Ross to use',
                'They are renting her old room out to a lodger'], a: 0,
      cue: '「surprise for you」のすぐあと。',
      line: 'We’re *turning your room into a gym*.',
      said: '「あなたの部屋をジムにするの」と告げる。',
      mean: 'turn A into B ＝ AをBに変える。だから昔の荷物を出してきた。',
      trap: '古い荷物が出てくると「誰かに貸す」と想像しやすい。turning … into のあとが答え。',
      use: 'We turned the garage into an office.（ガレージを仕事部屋にしたんだ）' },

    // R fix: V2 (blind 60 %, right), K6: the key was the only two-part, nuanced choice. Now all three are "X, but Y"
    // why: caught off guard ← "Wow, that is a surprise" taken at face value; curious ← "Just one little question"
    //   taken as a plain question (the Japanese frame), not a polite objection
    { id: 't1', skill: 'attitude', level: 'B2', point: 'whynot', seg: [46.8, 52.0],
      stem: 'How does Monica sound when she replies to the surprise?',
      choices: ['Upset, but keeping it polite', 'Pleased, but a little caught off guard',
                'Fine with it, but curious why'], a: 0,
      cue: '「Wow」のあと、ていねいな前置きと質問。',
      line: 'Wow, that is a surprise. Just *one little question*, uh, *why not Ross’s room*?',
      said: '「驚いた。ひとつだけ、なんで Ross の部屋じゃないの？」と言う。',
      mean: '自分の部屋が先に消えることへの不満を、礼儀正しい言い方で包んでいる。',
      trap: 'one little question は質問に聞こえるが、「なぜ兄でなく私？」は不満のしるし。',
      use: 'Just one little question: why me?（ひとつだけ聞いていい？なんで私？）' },

    // anchor: 51.0 s the only question she asks is "why not Ross's room?"; the parents' answer is all about "your
    //   brother" (53.8–60.2 s), and "God forbid" (61.2 s) answers that
    // R fix: V2 (blind 70 %, right). "Move back home" was weak and "always" marked the key; both distractors name Ross
    //   now (C2 recipe: sincerity flip)
    // why: prizes ← the reason is all trophies and badges, so the parents seem to value awards; proud ← "God forbid"
    //   heard as sincere, as if she shares their pride and only wants space
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'forbid', reveals: ['whynot', 'gym', 'trophies'],
      seg: [46.8, 62.5],
      stem: 'What does this talk about the rooms suggest about Monica and her parents?',
      choices: ['She feels they put Ross ahead of her', 'She feels they care more for prizes than people',
                'She is proud of Ross, but wants a room too'], a: 0,
      cue: '彼女が比べている相手は誰か。',
      line: 'Just one little question, uh, *why not Ross’s room*? … — Oh, *God forbid*.',
      said: '自分の部屋はジムに、Ross の部屋は賞のためにそのまま。「なぜ Ross じゃないの」と聞き、皮肉で返す。',
      mean: '比べている相手は兄だけ。「いつも兄が先」という思いが、質問と皮肉ににじむ。',
      trap: 'トロフィーの話なので「賞好きの親」と取りやすいが、問うのは「なぜ兄でなく私か」。',
      use: 'Why is it always me?（なんでいつも私なの？）' },

    // R fix: V2 (blind 65 %, right). The key was the only specific reason; both distractors are Ross-specific now
    // why: science kits ← "science" and "so many" heard, the awards missed; his son ← "your brother" plus the grandson
    //   asked about later in the clip
    { id: 'd3', skill: 'detail', level: 'B2', point: 'trophies', seg: [49.2, 60.8],
      stem: 'Why did her parents decide against using Ross’s room?',
      choices: ['They didn’t want to move his science awards', 'His old science kits still fill up the room',
                'They keep it for his visits with his son'], a: 0,
      cue: '「your brother has」のあとに並ぶもの。',
      line: 'your brother has so many *science trophies and plaques and merit badges*… we *didn’t want to disturb them*.',
      said: 'Ross の部屋には科学のトロフィーや盾、バッジが多く、動かしたくなかった。',
      mean: 'disturb ＝ 動かして乱す。賞の数々をそのまま飾っておきたい、という理由。',
      trap: 'science だけ拾うと「道具」に聞こえる。並ぶのは賞の数々。',
      use: 'Please don’t disturb my desk.（机の上、いじらないでね）' },

    // R fix: V2 (blind 55 %, right). "Fearfully" was weak; a second sarcastic reading aimed at Ross (C2 recipe:
    //   right mechanism, wrong target) makes the key one of two sarcastic choices
    // why: sincere ← "God forbid" is literally a polite wish that nothing bad happens; Ross ← the trophies are his, but
    //   the choice not to move them was the parents'
    { id: 't2', skill: 'attitude', level: 'C1', point: 'forbid', seg: [58.4, 62.5],
      stem: 'When Monica answers her parents’ last reason, how does she mean it?',
      choices: ['Sarcastically: his trophies get more care than she does', 'Sincerely: his trophies really are worth keeping safe',
                'Sarcastically: Ross is too old to keep his trophies'], a: 0,
      cue: '両親の理由の直後、短い一言。',
      line: 'we *didn’t want to disturb them*. — Oh, *God forbid*.',
      said: '「動かしたくなかったの」に「まあ、とんでもない」と返す。',
      mean: 'God forbid は本来「とんでもない」。ここは皮肉で「Ross の物はそんなに大事なのね」。',
      trap: '言葉どおりなら同意だが、自分の部屋は片づけられた直後。状況と言葉が逆なら皮肉を疑う。',
      use: 'Oh, God forbid we’re five minutes late.（5分遅れたら大変だもんね（皮肉））' },

    // R fix: V2 (blind 50 %, right). "Worked up the nerve" was the only inferred choice; all three are inferences now
    // why: turned down ← "No" comes right after "did they lend you the money"; waiting ← "yet" twice, with haven't
    //   heard as have
    { id: 'i2', skill: 'infer', level: 'B2', point: 'asked', seg: [101.9, 107.6],
      stem: 'At her parents’ place, where do things stand with the loan?',
      choices: ['She keeps putting off asking them for it', 'She asked, and they turned her down',
                'She asked, and is waiting for an answer'], a: 0,
      cue: '「No, but」のあと、何をしていないか。',
      line: 'No, but that’s probably cuz I *haven’t asked them yet*.',
      said: '「借りられた？」「ううん、たぶんまだ頼んでないから」と答える。',
      mean: '断られたのではなく、言い出せていない。だから「ほら」と背中を押される。',
      trap: 'No が先に来るので断られたと思いやすい。but のあとが事情。haven’t の t が弱くても否定。',
      use: 'I haven’t asked yet, but I will.（まだ聞いてないけど、聞いてみる）' },

    // why: dad angry ← the first shocked "You were fired?" sounds like an accusation; hurt ← "sorry I didn't tell you
    //   this before" heard as the real issue
    { id: 'g2', skill: 'gist', level: 'B2', point: 'panic', reveals: ['dip'], seg: [110.0, 150.8],
      stem: 'How do Monica’s parents take her news at dinner?',
      choices: ['Her mom panics, and her dad calms her down', 'Her dad gets angry, and her mom defends her',
                'Both are hurt that she kept it from them'], a: 0,
      cue: '「どうするの」のあとの、名前の呼びかけ。',
      line: 'What are you going to do? — *Judy, Judy, relax*.',
      said: '母が「どうするの」とあわて、父が「ジュディ、落ち着け。貯金があるだろう」となだめる。',
      mean: '心配する母と、楽観的な父。父は娘の育て方に自信を見せている。',
      trap: '最初の驚きの声は責めて聞こえやすいが、そのあとは心配と励まし。黙っていた件は誰も責めない。',
      use: 'Relax, it’s going to be fine.（落ち着いて、大丈夫だから）' },

    // R fix: V2 (blind 60 %, right), K6: the key was the only nuanced choice and the only one with "firing". Now
    //   vague / straight out / chose to quit
    // why: straight out ← "You were fired?" comes right after, as if she had said it; chose to quit ← "I had to leave
    //   it" read literally as her own choice
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'fired', seg: [112.9, 125.0],
      stem: 'What is Monica doing when she first tells them about her job?',
      choices: ['Avoiding saying plainly what has happened', 'Telling them straight out she was fired',
                'Making it clear that she chose to quit'], a: 0,
      cue: '仕事のことを言う言い方と、理由を聞かれた答え。',
      line: 'I’m *no longer at my job*. I had to *leave* it. — Why? — Because *they made me*.',
      said: '「もうその仕事にはいないの。辞めるしかなくて」。理由は「向こうがそうさせたから」。',
      mean: 'クビという語を避け、ぼかして伝えている。',
      trap: 'had to leave は自分で辞めたようにも聞こえるが、they made me で辞めさせられたと分かる。',
      use: 'We’re no longer together.（もう付き合ってないの）' },

    // R fix: V2 (blind 60 %, right). "Falls apart in three words" was the only clever-sounding choice; the joke
    //   distractor is now a dodge, which a quick quip also sounds like
    // why: blames parents ← "they" heard as the people at the table; dodge ← a quick quip sounds like an effort to
    //   avoid the question
    { id: 'h3', skill: 'humor', level: 'C1', point: 'fired', seg: [117.8, 129.5],
      stem: 'Why does the audience laugh at Monica’s answer to “Why?”',
      choices: ['It gives away what she was trying to hide', 'It blames her parents for what happened',
                'She dodges the question with a quick joke'], a: 0,
      cue: '「辞めるしかなくて」と、その答えをつなげて。',
      line: 'I had to leave it. — Why? — *Because they made me*.',
      said: '「辞めるしかなくて」「なぜ？」「向こうがそうさせたから」。',
      mean: 'ぼかした言い方が、一言でただのクビだと分かってしまう。その落差が笑い。',
      trap: 'they は目の前の両親ではなく会社。代名詞が誰を指すかは、話の流れで決める。',
      use: 'Let’s just say it didn’t work out.（まあ、うまくいかなかったってこと）' },

    // why: 20% ← "twenty" and the -ty ending, also a common savings rule; 15% ← "-teen" heard in place of "ten"
    { id: 'n2', skill: 'number', level: 'B1', point: 'tenpct', seg: [135.0, 140.2], keep: true,
      stem: 'How much of her paycheck does Jack say goes into the bank?',
      choices: ['10%', '15%', '20%'], a: 0,
      cue: '「paycheck」の直前の数字。',
      line: '*10% of your paycheck*, where does it go? — Into the bank.',
      said: '父が「給料の10パーセントはどこへ？」と聞き、娘が「銀行」と答える。',
      mean: '昔から教えた習慣をクイズの形で確かめ、だから大丈夫だと言っている。',
      trap: 'ten は短い一音。fifteen なら -teen が長く強く、twenty なら「トゥエ」の音がある。',
      use: 'I save 10% of every paycheck.（給料の1割は必ず貯金してる）' },

    // R fix: V2 (blind 50 %, right). The choices are shorter and parallel now. Still near the line: a broke learner's
    //   common sense points at spending, but only "dip into" says it
    // why: keep adding ← dip read as "dip into a pool" (putting in); emergency ← "that's what it's there for" heard
    //   as "save it for an emergency"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'dip', seg: [141.4, 145.9],
      stem: 'What does Jack want Monica to do with her savings?',
      choices: ['Use some of them to get by', 'Keep adding a bit to them', 'Save them for a real emergency'], a: 0,
      cue: '「So, she」のあとの動詞。',
      line: 'So, she *dips into her savings*. That’s what it’s there for.',
      said: '「だから貯金を少し使えばいい。そのためにあるんだ」。',
      mean: 'dip into ＝ 蓄えに手をつけて少し使う。今がその「困ったとき」だと父は言っている。',
      trap: 'dip を「入れる」と取ると「貯金を増やす」に聞こえる。into の先から取り出す動き。',
      use: 'I had to dip into my travel fund.（旅行資金に手をつけちゃった）' },

    // R fix: V2 (blind 55 %, right), K6: "without saying it outright" was the only nuanced choice. All three are
    //   hints now
    // why: savings enough ← "find it" taken right after "savings"; look for work ← "you know where to find it" heard
    //   as "you know where to find a job"
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'extra', seg: [145.9, 150.8],
      stem: 'At the end of Jack’s speech, what is he doing?',
      choices: ['Hinting that they’ll help if she’s short', 'Hinting that she should look harder for work',
                'Hinting that her savings should be enough'], a: 0,
      cue: '最後の文、条件をつける部分。',
      line: 'if you need *a little extra*, *you know where to find it*.',
      said: '「少し足りなければ、どこにあるか分かってるだろ」と言う。',
      mean: '「うちに来れば出すよ」という申し出を、遠回しに伝えている。',
      trap: 'find it を仕事や貯金と取りやすいが、前に a little extra がある。',
      use: 'You know where to find me.（何かあったら声をかけてね）' },

    // why: end of month ← a usual loan deadline; find a job ← her job loss is the reason for the loan
    { id: 'd6', skill: 'detail', level: 'B1', point: 'payback', seg: [155.0, 158.5],
      stem: 'When does Monica have to pay the money back?',
      choices: ['Whenever she likes', 'By the end of the month', 'Once she finds a job'], a: 0,
      cue: '「Here you go」のあと。',
      line: 'You can pay me back *whenever you like*.',
      said: '「返すのはいつでもいいよ」と小切手を渡す。',
      mean: '期限なしで貸す、という気前のいい申し出。最初に断られた理由への答えにもなっている。',
      trap: '「月末まで」「仕事が決まったら」は貸し借りでよくある条件だが、ここでは何の条件もない。',
      use: 'No rush. Pay me back whenever.（急がないよ。返すのはいつでも）' },

    // why: correcting ← "I mean" as a self-repair (いや、つまり); joke ← dinosaur checks seem silly, and the double
    //   "Yeah" sounds sheepish
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [161.2, 166.6],
      stem: 'Right after the “Yeah. Yeah,” about the checks, what is the lender doing?',
      choices: ['Explaining why the checks make sense', 'Correcting something said a moment ago',
                'Admitting that the checks are a joke'], a: 0,
      cue: '「Yeah. Yeah,」のすぐあとの短いつなぎ。',
      line: 'Yeah, *I mean*, you get your money and you learn a little something.',
      said: '「うん。だってさ、お金はもらえるし、ちょっと勉強にもなる。何が悪いの？」。',
      mean: 'I mean はここで「だって」。言い訳や理由を足すときの前置き。',
      trap: 'I mean は言い直しにも使うが、ここは前の言葉を直していない。後ろに理由が続くかを聞く。',
      use: 'I mean, it’s free, so why not?（だって無料だし、いいじゃん）' },

    // R fix: V2 (blind 70 %, right), K6: the key was the only kind choice. "Praise" is kind too (cheap read as
    //   thrifty), and "cash instead" was weak
    // why: complaint ← "cheap" is an insult, so it sounds like a real gripe; praise ← cheap read as 節約上手, careful
    //   with money
    { id: 't3', skill: 'attitude', level: 'B2', point: 'saurus', seg: [166.5, 175.6],
      stem: 'When Monica gives the lender a dinosaur nickname, how does she mean it?',
      choices: ['As a tease, quickly taken back', 'As praise for being careful with money',
                'As a real complaint about the amount'], a: 0,
      cue: 'あだ名のあと、同じ言葉を2回くり返すところ。',
      line: 'Hey, you’re a *cheap-a-saurus*. … *I’m kidding*. Thank you. I’m very grateful.',
      said: '「ケチザウルスね」と言い、すぐ「冗談。ありがとう、感謝してる」。',
      mean: 'cheap（ケチ）に恐竜の -saurus を付けた造語。すぐお礼で打ち消す。',
      trap: 'cheap は悪口なので本気の不満に聞こえやすい。直後の冗談だという一言とお礼が本音。',
      use: 'I’m kidding! Thanks so much.（冗談だよ！本当にありがとう）' }
  ]
};
