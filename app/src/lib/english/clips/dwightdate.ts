// REVIEW 2026-11-16: pass 3, fix 16, drop 0, new 0; ear checks 1
//   (fixes: 12 blind-pass rebalances, i1 and nt2 stems (S1, K1), x1 and d4 segment edges)
// “Dwight Interrupts Michael's Date - The Office US” (the official The Office channel, Best of Season 6): a night out
// in quick cuts; Dwight's farm talk wins a woman over, he pitches an invention, then pulls Michael away for "twins".
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 112 s; whisper's lines after that are a
// loop. Untested: 6–17 s (Dwight's shirt explained in sexual terms), "Mose hates to gild the horses" (both sources,
// likely "geld"), 72–88 s ("Sears said no": whisper has "no" at 74.1 s, the captions at 81.2 s, before the Pixar
// lines, so the punchline and the Pixar speaker are unclear), and the company names (the captions garble them).
// EAR CHECK: 96 s g2 p1 — "Oh, my God. Twins. I'm sorry. You understand. Nice to meet you" assumed Michael's (he
//   answers "I found twins" after Dwight calls "Michael"; no name in the line itself)
import type { Clip } from '../types.ts';

export const dwightDate: Clip = {
  id: 'dwightdate', video: '-3qsZ2HTmKQ', title: 'Dwight Interrupts Michael\'s Date', dur: 133, wpm: 163, band: 'slow',
  tags: ['恋愛', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind 70 %: the question choice wasn't parallel (no "As X:" frame); all three now name a move and a reading
    // why: guess ← "Looks like you're going to…" heard as a guess at where he's off to; praise ← "casual" heard just
    //   before, and relaxed clothes sound like a compliment
    { id: 'a0', skill: 'attitude', level: 'C1', point: 'outfit', seg: [0, 5.9],
      stem: 'How is the remark about a fish fry meant?',
      choices: ['As a tease: the outfit looks out of place', 'As a guess: he must be off to a party',
                'As praise: he looks relaxed and easygoing'], a: 0,
      cue: '「What are you wearing?」から続く流れ。',
      line: 'What are you wearing? … *Looks like you’re going to a fish fry*, Dwight.',
      said: '「社交服」だと言う相手に「魚フライの集まりに行くみたい」と返す。',
      mean: 'fish fry は気取らない食事会。服が場違いだとからかっている。',
      trap: 'going to を行き先の質問と取りやすい。Looks like ～ は見た目への感想。',
      use: 'Looks like you’re ready for the beach!（海にでも行くみたいだね！）' },

    // R fix: blind 55 %: "two sisters" made the date choice odd; it now matches the title's "date" (§9.4), so the
    //   title pulls toward a distractor, not the key
    // why: selling ← Dwight describes his invention and lists companies; double date ← the title says "date", and
    //   "twins" sounds like a pair set up in advance
    { id: 'g1', skill: 'gist', level: 'B2', point: 'night', reveals: ['drop', 'twins'], seg: [20.4, 112.3],
      stem: 'What are Michael and Dwight mostly doing tonight?',
      choices: ['Trying to pick up women together', 'Selling Dwight’s latest invention', 'On a double date set up for them'], a: 0,
      cue: '後半の「Drop this one」と、そのあとの流れ。',
      said: '二人で女性に話しかけ、合わないと次へ移る。最後は双子を見つけて移動する。',
      mean: '二人組で女性に声をかけて回る夜。Dwight が話をさらう。',
      trap: '発明の話は目の前の女性に向けたもの。双子も途中で見つけた話で、約束ではない。',
      use: 'Want to go say hi to them?（あの人たちに声かけに行く？）' },

    // R fix: blind 65 %: "knows nothing about men's style" was off the clip's words; now a "blunt" reading of "No,
    //   it's not a good idea"
    // why: wore one ← "no such thing as a good hairpiece" sounds like the voice of experience; blunt ← Oscar's flat
    //   "No, it's not a good idea" heard as the thing being pushed back on
    { id: 'd2', skill: 'detail', level: 'B1', point: 'hair', seg: [23.5, 36.6],
      stem: 'When Oscar warns against a hairpiece, why is his advice brushed off?',
      choices: ['He has a full head of thick hair', 'He once wore a bad hairpiece himself',
                'He always gives his advice too bluntly'], a: 0,
      cue: '「Oscar」と呼んだあとの「You …」の文。',
      line: 'that’s easy enough for you to say, Oscar. You have that *thick, beautiful* … *hair*.',
      said: '「君だから言えるんだ。太くてきれいな髪があるんだから」と返す。',
      mean: '髪の悩みがない人の忠告は聞けない、という言い分。かつらを考えているのは話し手。',
      trap: '経験者の言葉にも聞こえるが、理由は Oscar 自身の髪。You have のあとを聞く。',
      use: 'You’ve never had this problem.（君はこの悩み、なったことないでしょ）' },

    // R fix: blind 65 %: the key was the only choice without "easy"/"follow"-type surface words; reworded so the key
    //   also carries "easy", the keyword the trap builds on
    // why: simple ← "easy" read as "your advice is easy to follow"; agreeing ← "Yeah" at the start heard as a yes
    //   (the Japanese はい frame)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hair', seg: [25.8, 31],
      stem: 'What does the reply starting “Yeah, but” say about Oscar’s advice?',
      choices: ['It’s easy to give when it isn’t your problem', 'It is simple and easy to follow',
                'It is right, and he plans to follow it'], a: 0,
      cue: '「Yeah, but」の but のあと。',
      line: 'Yeah, but *that’s easy enough for you to say*, Oscar.',
      said: '「まあね、でもそれは君だから言えることだよ」と返す。',
      mean: 'easy for you to say ＝ 自分は困らないから言える。忠告を押し返す決まり文句。',
      trap: 'Yeah を賛成と取ると同意に聞こえる。Yeah, but のあとが本音。',
      use: 'That’s easy for you to say.（君だから言えるんだよ）' },

    // R fix: seg starts at 25.8 (was 25.9, 0.4 s before "There's"; "idea" ends 25.78)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'nosuch', seg: [25.8, 28.3],
      stem: 'Type Oscar’s words: “There’s ___ a good hairpiece.” (4 words)', answer: 'no such thing as',
      cue: '「There’s」のすぐあと、つながる4語。',
      line: 'There’s *no such thing as* a good hairpiece.',
      said: '「いいかつらなんてものは存在しない」と言い切る。',
      mean: 'no such thing as ～ ＝ ～なんてない。such thing as が一続きに。',
      trap: 'as はほぼ「ァズ」と弱く、次の a と重なる。決まった型で覚えると拾える。',
      use: 'There’s no such thing as a free lunch.（ただより高いものはない）' },

    // R fix: blind 65 %: "angry enough to start a real fight" was a filler and the key the only nuanced choice; now a
    //   "bored" reading, and the three are parallel
    // why: bored ← "shut up about the farm" heard as his own fatigue with Dwight's stories; teasing ← "shut up"
    //   between friends is often play
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'farm', seg: [42.4, 46.3],
      stem: 'How does the speaker feel about Dwight’s farm talk?',
      choices: ['Worried the woman will find it boring', 'Tired of farm stories he’s heard before',
                'Only teasing a friend in a playful way'], a: 0,
      cue: '「shut up」のあとに続く二つの理由。',
      line: '*shut up about the farm*. It’s *not relatable*.',
      said: '「農場の話はやめろ。共感されない」と止める。',
      mean: 'relatable ＝ 聞き手が自分ごとに感じられる。女性受けしない話題だと心配している。',
      trap: 'shut up だけだと自分が飽きたようにも、ふざけたようにも聞こえる。強い言葉は、続く理由で温度を測る。',
      use: 'Let’s talk about something more relatable.（もっと身近な話をしよう）' },

    // R fix: S1: "that warning" presupposed a1's key; stem now names the moment. Choices recast as three verdicts on
    //   Michael's call (blind 65 %)
    // why: got through ← "How many horses…?" heard as polite small talk that moves things along; bores her ← "cool"
    //   read as クール (cold, unmoved), the katakana false friend
    { id: 'i1', skill: 'infer', level: 'C1', point: 'backfire', reveals: ['farm'], seg: [42.4, 52.3],
      stem: 'Right after “Nobody owns a farm”, what does the woman’s reply show?',
      choices: ['Michael misjudged; she likes the farm talk', 'Michael got through; she changes the subject',
                'Michael was right; farm talk bores her'], a: 0,
      cue: '「Wait」で始まる返事と、そのあとの質問。',
      line: 'Nobody owns a farm. — *Wait, you’re worried about your horses? That’s cool.*',
      said: '止めた直後、女性が「馬が心配なの？すてき」と食いつく。',
      mean: '止めた話題に相手が興味を示し、心配が裏目に出る。That’s cool は「いいね」。',
      trap: 'cool を「クール（冷めた）」と取ると逆になる。続けて質問していれば、話に乗っている。',
      use: 'Wait, you play the guitar? That’s cool.（え、ギター弾けるの？いいね）' },

    // why: Nine ← "and three quarters" said weakly after; a half ← the usual fraction; Ninety-three ← "nine-and-three"
    //   runs together like "ninety-three"
    { id: 'n1', skill: 'number', level: 'B1', point: 'horses', seg: [49.8, 54.05], keep: true,
      stem: 'How many horses does Dwight say he has?',
      choices: ['Nine', 'Nine and a half', 'Nine and three quarters', 'Ninety-three'], a: 2,
      cue: '「How many horses」への答え、最後まで。',
      line: '*Nine and three quarters.*',
      said: '「何頭いるの？」と聞かれ、「9と4分の3頭」と答える。',
      mean: 'three quarters ＝ 4分の3。馬の数としてはありえない半端な数。',
      trap: 'and が弱く「ナインナン」とつながり ninety にも聞こえる。quarters まで聞く。',
      use: 'The glass is three quarters full.（グラスは4分の3まで入ってる）' },

    // why: pony ← a small horse "counting less" is a reading a fluent listener can build alone; part-owned ← Mose was
    //   named just before as working the horses, so shared ownership fits
    // anchor: 52.4–53.6 s "Nine and three quarters", then 54.1–64.4 s "…obtain… hamburgers… from a horse without killing
    //   the animal": the missing quarter has gone into burgers
    // R fix: blind 70 %: the stem named the invention, and only the key was about it; the stem now just names the count
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'device', reveals: ['horses'], seg: [49.8, 64.7],
      stem: 'What explains the odd number in Dwight’s answer about horses?',
      choices: ['One horse has already given up some burgers', 'One horse is just a pony, so it counts less',
                'One horse is partly owned by Mose on the farm'], a: 0,
      cue: '数の答えと、すぐあとの発明の説明をつなぐ。',
      line: '*Nine and three quarters.* … from a horse *without killing the animal*.',
      said: '馬は「9と4分の3頭」と答え、続けて「馬を殺さずにハンバーガーを取り出す装置」の話をする。',
      mean: '半端な4分の3頭は、発明をもう試した跡。数の謎があとの説明で解ける、時間差の笑い。',
      trap: 'ポニーや共同の持ち主など、数だけで理由を作りやすい。変な数字が出たら、すぐあとの話とつなげる。',
      use: 'So that explains the missing cookies.（それでクッキーが減ってたのか）' },

    // why: Ten ← the "-lve" end is weak, so it sounds like a short number; Twenty ← twelve and twenty share "tw-"
    { id: 'n2', skill: 'number', level: 'B1', point: 'sliders', seg: [54.05, 64.7], keep: true,
      stem: 'Instead of six regular burgers, how many sliders can you get?',
      choices: ['Ten', 'Twelve', 'Twenty'], a: 1,
      cue: '「or」のすぐあと、sliders の前の数。',
      line: 'six regular-sized hamburgers, or *12 sliders*',
      said: '「普通サイズのハンバーガー6個、またはスライダー12個」と言う。',
      mean: 'slider はミニサイズのハンバーガー。小さいので数は2倍。',
      trap: 'twelve と twenty は出だしが同じ。twelve は短く終わり、twenty は「ニー」と伸びる。',
      use: 'Can we get a plate of sliders?（ミニバーガーを一皿もらえる？）' },

    // why: travel ← "on the go" = while moving, a known chunk, taken as what the device is for; deliver ← "from a horse"
    //   heard as transport by horse
    { id: 'd3', skill: 'detail', level: 'B1', point: 'device', seg: [54.05, 64.7],
      stem: 'What is Dwight’s invention supposed to do?',
      choices: ['Take burger meat from a living horse', 'Cook burgers fast while you travel',
                'Deliver burgers to people by horse'], a: 0,
      cue: '「obtain」から「animal」までの説明。',
      line: 'obtain… hamburgers… *from a horse without killing the animal*.',
      said: '「馬を殺さずに、馬からハンバーガーを取り出せる装置」だと説明する。',
      mean: '生きた馬から肉を取る、という突飛な発明。on the go は言葉遊び。',
      trap: 'on the go を聞くと「移動しながら食べる」道具に聞こえる。名前より、続く説明の動詞で判断。',
      use: 'I usually eat breakfast on the go.（朝ごはんはだいたい移動しながら）' },

    // R fix: blind 75 %: the stem quoted the phrase under test (§9.2); now names the moment, choices evened out
    // why: close to a deal ← "considering" heard as serious interest from big names; just started ← "still" read as
    //   "he hasn't shown them all yet"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'considering', seg: [64.45, 72.5],
      stem: 'What does the list of companies suggest about his invention?',
      choices: ['None of the firms has actually said yes', 'Several of the firms are close to a deal',
                'He has only just started showing it around'], a: 0,
      cue: '会社名ごとにくり返される同じ言い方。',
      line: 'George Foreman is *still considering it*. … is *still considering it*.',
      said: '有名な会社を次々に挙げ、どこも「まだ検討中」だと言う。',
      mean: 'still considering は返事がないまま。何社も並ぶほど、乗り気でないと分かる。',
      trap: '大手の名前で有望に聞こえる。同じ「検討中」が続いたら、遠回しの no を疑う。',
      use: 'They said they’d think about it.（考えておくって言われた）' },

    // why: lots of interest ← the sincerity flip: big names plus "considering" taken as good news; when to decide ←
    //   the literal reading: considering = a decision on its way
    // anchor: 64.8–72.2 s the same "is still considering it" after one company name after another, for a device that
    //   takes meat from a living horse (54.1–64.4 s): nobody has said yes, and nobody will
    // R fix: K1/V1: "got the joke" had no joke to get (Dwight means it); the stem now asks which reply fits what the
    //   list really tells her, so the sincere "Wow" is the near miss, not a rival key
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'considering', seg: [64.45, 72.5],
      stem: 'Which reply from the woman would fit what his list really tells her?',
      choices: ['So, no one has said yes yet?', 'Wow, that’s a lot of interest!', 'When do they have to decide?'], a: 0,
      cue: '同じ言い方の回数と、発明の中身。',
      line: '… is *still considering it*. … is *still considering it*.',
      said: '会社名を挙げるたびに「まだ検討中」をくり返す。発明は生きた馬から肉を取る装置。',
      mean: '本人は明るく言うが、何社も検討中のままなのは返事がない印。気づいたなら、からかい半分に確かめるのが合う。',
      trap: '有名な名前が並ぶと「すごいね」と返しやすい。返事は言葉の調子でなく、話の中身の実態に合わせる。',
      use: 'So that’s a no, then?（つまりダメってこと？）' },

    // R fix: blind 80 %: "tired of hearing about horses" had no tie to Michael's talk; all three now "Dwight tells him…"
    // why: she's bored ← "I'm bored" is said, but by Dwight, about his own talk; go home ← "Drop this one" heard as
    //   calling the night off
    { id: 'g2', skill: 'gist', level: 'B2', point: 'twins', reveals: ['drop', 'men'], seg: [86.8, 112.3],
      stem: 'Why does Michael suddenly end the talk with the woman?',
      choices: ['Dwight tells him he has found twins', 'Dwight tells him the woman seems bored',
                'Dwight tells him it’s time to go home'], a: 0,
      cue: '「Why?」と聞き返したあとの答え。',
      line: 'Why? — I *found twins*. — Oh, my God. Twins.',
      said: '「なぜ？」に「双子を見つけた」と返され、喜んで女性に別れを告げる。その双子は男だった。',
      mean: '双子と聞いただけで、話していた相手をあっさり置いていく。',
      trap: 'I’m bored が聞こえるが、退屈なのは呼びに来た側。誰の気持ちかは主語で確かめる。',
      use: 'Sorry, something came up. I have to go.（ごめん、用事ができた。行かなきゃ）' },

    // R fix: blind 70 %: "quit drinking" was a weak reading of drop; now the "drop it" (let it go) idiom
    // why: let it go ← "drop it" = stop arguing, a common chunk; story ← "I'm bored" right after, and a long story was
    //   just being told
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'drop', reveals: ['twins'], seg: [88.4, 91.5],
      stem: 'When Dwight calls Michael over, what is he asking him to do?',
      choices: ['Leave the woman he’s talking to', 'Let go of the point he’s arguing', 'Stop his story; it’s boring'], a: 0,
      cue: '「this one」が指すもの。すぐあとの理由も。',
      line: '*Drop this one.* I’m bored.',
      said: '「この子はやめとけ。退屈だ」と呼びかける。',
      mean: 'drop ＝ 手を引く。this one は今話している女性。人に使うとかなり失礼な言い方。',
      trap: 'drop it（その話はやめろ）と取りやすい。this one が何かは次の一言で確かめる。',
      use: 'Let’s drop this topic, okay?（この話はやめよう、ね？）' },

    // R fix: blind 60 %: the key was the only two-part choice; the distractors now have a reason too
    // why: apology ← "I'm sorry" at face value, as if he'd said something wrong; check ← "You understand" heard as a
    //   question (分かった？)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'sorry', seg: [93.45, 99.4],
      stem: 'Hearing about the twins, what do the next words to the woman do?',
      choices: ['End the talk, assuming she won’t mind', 'Apologize for something rude he said',
                'Check she understood, then explain more'], a: 0,
      cue: '「Twins.」のすぐあとの短い3つの文。',
      line: '*I’m sorry. You understand. Nice to meet you.*',
      said: '「ごめん。分かるよね。会えてよかった」と言い残す。',
      mean: 'You understand. は質問でなく「分かるよね」の決めつけ。謝る形で話を切り上げる。',
      trap: 'I’m sorry を謝罪と取りやすい。Nice to meet you で締めたら別れの言葉。',
      use: 'Sorry, you understand. Gotta run!（ごめん、分かるよね。急がなきゃ！）' },

    // R fix: blind 50 %: "Weren't they" was out of place for people standing there; now "Aren't those"
    // why: Are they ← the final "n't" is barely there before "they"; Aren't those ← a near sound, and the twins are
    //   across the room; Aren't these ← "they" and "these" both start with a soft th
    { id: 's1', skill: 'sound', level: 'B2', point: 'arent', seg: [99.3, 106.05],
      stem: 'Fill the gap: “___ magnificent?”',
      choices: ['Aren’t they', 'Are they', 'Aren’t those', 'Aren’t these'], a: 0,
      cue: '文の最初の2語。母音と最後の子音に注意。',
      line: '*Aren’t they* magnificent?',
      said: '双子を見せて「すばらしくない？」と同意を求める。',
      mean: 'Aren’t they ～? は同意を求める形。aren’t の t はほぼ消える。',
      trap: 't が消えても n の音は残る。Are they なら単なる質問で、相手の意見を聞く形になる。',
      use: 'Aren’t these shoes cute?（この靴かわいくない？）' },

    // why: not twins ← a twist about the twins themselves is the expected surprise; taken ← the dating script: they
    //   already have partners
    // R fix: seg ends at 107.95 (was 108, cutting "I love")
    { id: 'd4', skill: 'detail', level: 'B1', point: 'men', seg: [99.3, 107.95],
      stem: 'What turns out to be the problem with the twins?',
      choices: ['They’re men, not women', 'They’re not really twins', 'They’re already taken'], a: 0,
      cue: '「magnificent?」への返事、最初の2語。',
      line: '*They’re men*, Dwight.',
      said: '「すばらしいだろ？」に「男じゃないか、Dwight」と返す。',
      mean: '女性の双子だと思って来たのに、男の双子だった。期待が外れる。',
      trap: 'men は短く、文末の Dwight に気を取られやすい。返事の最初の2語に答えがあることが多い。',
      use: 'Wait, they’re not who I thought.（あれ、思ってた人たちじゃない）' },

    // R fix: blind 55 %: the key was the only two-part choice; reworded to one clause like the others
    // why: sorry ← a reply right after a complaint heard as an apology; teasing ← the joke aimed at Michael, who got
    //   excited (but Dwight himself called them "magnificent")
    { id: 'h2', skill: 'humor', level: 'C1', point: 'men', seg: [105.6, 112.3],
      stem: 'Why is Dwight’s reply to the news about the men funny?',
      choices: ['He just wanted twins, not dates for them', 'He’s sorry he didn’t look more closely',
                'He’s teasing Michael for getting excited'], a: 0,
      cue: '「a good set of」という言い方。',
      line: 'I *love finding a good set of twins*.',
      said: '男だと言われても「いい双子を見つけるのが好きなんだ」と答える。',
      mean: 'a good set of は道具を集める時の言い方。女性かは関係なく、双子そのものが好き。',
      trap: '文句のあとの返事は謝罪に聞こえやすいが、I love で始まる。動詞で気持ちを聞く。',
      use: 'I love finding a good used bookstore.（いい古本屋を見つけるのが好き）' },
  ]
};
