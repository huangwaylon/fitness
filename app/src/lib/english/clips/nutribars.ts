// REVIEW 2026-11-16: pass 7, fix 12, drop 2, new 1; ear checks 3
// “Ann's First Public Forum | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Ann, a
// nurse, warns a town forum that the energy bars are unhealthy; Ron tells the camera Leslie should butt out because
// eating yourself to death is a freedom; the questions run from sugar and lasagna to Ann's phone number, and Leslie
// leaves "encouraged".
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Leslie (11.0 s). Ann and Ron are
// never named, so stems name them as the show does; only w1 depends on who speaks. The questioners are never named:
// stems call each "the next person".
// Untested: 1.2 s (the brand: whisper "NutriHum's", captions "nutrients"); 17.8 s (whisper "die of a heart attack",
// captions "I have a heart attack": n1 turns only on "43" and its stem avoids those words); 26.9 s ("sugar is" vs
// "sugar's"); 47.0 s ("How do we know" vs "How do I know": i2 turns on what follows); 65–71 s (the "ham and mayonnaise"
// chant overlaps); 60.0 s (whisper "Oh, my God. No.", captions only "no").
// EAR CHECK: 45.3 s t2 — "Oh, boy" is a weary sigh, not a happy "oh boy" (both sources have the words; the key rests on tone)
// EAR CHECK: 71.9 s w1 — Ann says "I can't believe you do this every week" to Leslie, and Leslie answers (no name in the audio)
// EAR CHECK: 75.8 s i3 nt3 w1 — "usual" ends before 77.5 s (whisper ≈ 76 s; the captions put "usual" at 84.8 s, in the music)
import type { Clip } from '../types.ts';

export const nutribars: Clip = {
  id: 'nutribars', video: 'q_dJUYPGtYk', title: 'Ann’s First Public Forum', dur: 97, wpm: 154, band: 'mid',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 70 % (the key was the only pair of the two repeated parts); now the repeated parts point away from it
    // why: corn syrup and added salt ← "corn syrup" caught, "fatty oils" lost and filled with the usual junk-food word;
    //   corn flour and added salt ← "corn" caught, "syrup" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'syrup', seg: [0.5, 10.7],
      stem: 'According to Ann, what makes the energy bars unhealthy?',
      choices: ['Corn syrup and fatty oils', 'Corn syrup and added salt', 'Corn flour and added salt'], a: 0,
      cue: '「loaded with」のあと、並ぶ二つの中身。',
      line: 'loaded with *high-fructose corn syrup and fatty oils*',
      said: 'バーにはコーンシロップと脂っこい油がたっぷり入っている、と説明する。',
      mean: 'loaded with ＝ 〜がたっぷり。体に悪い物が詰まっている、という言い方。',
      trap: 'corn だけ拾うと、残りをよくある材料で埋めやすい。and の前後の二つを最後まで聞く。',
      use: 'This soup is loaded with salt.（このスープ、塩がすごく多い）' },

    // R fix: blind 50 % (the third choice swapped her role, so it was out at a glance); all three now share her half
    // why: not that unhealthy ← Ron argues against Leslie, so he seems to defend the bars themselves; Leslie takes them
    //   away ← "Leslie needs to" heard without "butt out"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'views', reveals: ['free'], seg: [0.5, 24.4],
      stem: 'How do the first two speakers differ on the bars?',
      choices: ['She warns about them; he defends people’s right to eat them',
                'She warns about them; he says they are not that unhealthy',
                'She warns about them; he says Leslie should take them away'], a: 0,
      cue: '男性が「garbage」と呼ぶものと、そのあとの「you can」。',
      line: 'they’re just extremely *unhealthy* … if you want to *eat garbage* … *you can*.',
      said: 'Ann はバーが体に悪いと説明し、Ron は「ゴミを食べたいなら食べればいい」と語る。',
      mean: 'Ron も体に悪いことは認めている。争点は健康ではなく、選ぶ自由。',
      trap: 'Ron が反論するので「バーは悪くない」派に思える。何に反対しているかを聞く。',
      use: 'It’s your call.（それはあなたが決めることだよ）' },

    // R fix: blind 60 % ("whichever flavor" was a filler); now "even in small amounts", slice = 一切れ
    // why: cut them up ← slice = 切る, read literally as how the bars are eaten; small amounts ← slice = a thin piece,
    //   read as "even one slice"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'slice', seg: [5.95, 10.7],
      stem: 'When Ann sums up the bars, what does her idiom mean?',
      choices: ['However you look at it', 'However you cut them up', 'Even in small amounts'], a: 0,
      cue: '「unhealthy」の直前、まとめに入る決まり文句。',
      line: 'and *any way you slice it*, they’re just extremely unhealthy',
      said: 'どう見ても、あのバーは体にとても悪い、とまとめる。',
      mean: 'any way you slice it ＝ どの角度から見ても。結論を言い切る前の決まり文句。',
      trap: 'slice は「切る」なので、食べ方の話に聞こえやすい。結論の前に来る決まり文句として覚える。',
      use: 'Any way you slice it, we’re late.（どう考えても遅刻だね）' },

    // R fix: blind 70 % (both distractors were fillers); now /ʌ/–/æ/ "back up" and "hear … out"
    // why: back up ← butt /ʌ/ heard as back /æ/; hear everyone out ← "out" kept, tied to the phrasal verb hear out
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'buttout', seg: [10.5, 14.4],
      stem: 'In Ron’s first words to the camera, what does he want Leslie to do?',
      choices: ['Stop getting involved', 'Back up what she says', 'Hear everyone out'], a: 0,
      cue: 'Leslie の名前のすぐあと、短い句動詞。',
      line: '*Leslie needs to butt out*.',
      said: '「Leslie は口を出すのをやめるべきだ」とカメラに言う。',
      mean: 'butt out ＝ 他人のことに首を突っ込まない。くだけたきつめの言い方。',
      trap: 'butt は back に、out は hear out に聞こえやすい。butt out で一つの句。',
      use: 'Sorry, I’ll butt out.（ごめん、口出しはやめとく）' },

    // R fix: blind 50 % (the only odd number); a second "-three" and /θ/–/f/ added, 4 choices
    // why: Thirty-three ← /f/ heard as /θ/, the "-three" kept; Forty ← the "40 years" said later, and the weak "-three"
    //   is lost; Sixty ← "600 pounds" just before
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [10.5, 20.5], keep: true,
      stem: 'In Ron’s example, how old are you at the heart attack?',
      choices: ['Thirty-three', 'Forty', 'Forty-three', 'Sixty'], a: 2,
      cue: 'heart attack のすぐあとの数字。',
      line: 'balloon up to 600 pounds and … a heart attack at *43*',
      said: '「600ポンドまで太って、43歳で心臓発作」という例を出す。',
      mean: '極端な例を出して、それでも自由だという主張を強めている。',
      trap: '直前の600につられやすい。数字が二つ続くときは、どの名詞についているかを聞く。',
      use: 'I had my first kid at thirty-three.（33歳で最初の子が生まれた）' },

    // R fix: blind 60–85 % (the key was the only sincere reading, and the stem's "To me" pointed at it); the stem no
    //   longer quotes the line, and a second sincere reading is wrong on content ("garbage")
    // why: mocking ← praising a death at 43 sounds like sarcasm; not that bad ← he argues against the warning, so he
    //   seems to defend the food itself, missing that he calls it "garbage"
    { id: 't1', skill: 'attitude', level: 'C1', point: 'free', reveals: ['doso'], seg: [10.5, 24.4],
      stem: 'What does Ron mean by his last line to the camera?',
      choices: ['He truly values the freedom to choose', 'He is mocking people who eat so badly',
                'He truly thinks the bars aren’t that bad'], a: 0,
      cue: '直前の「you can」と、その言いかえ。',
      line: 'You are *free to do so*. To me, *that’s beautiful*.',
      said: '「太って43歳で死ぬのも自由。それが美しい」と言う。',
      mean: '皮肉ではなく本気。体に悪くても、自分で選べること自体をすばらしいと思っている。',
      trap: 'ひどい結末をほめるので皮肉に聞こえやすい。直前の「自由」から、ほめる対象を決める。',
      use: 'It’s a free country.（自由の国だからね／好きにすれば）' },

    // why: sad but your right ← sincerity flip: the grim example heard as a reluctant concession; eat better ← the usual
    //   "nanny state" stance, adding a "should" he never says
    // anchor: 22.6–23.9 s "To me, that's beautiful" right after "you are free to do so": he praises the choice
    //   itself, not just puts up with it
    // retired: for the draws: play 3+ drew no C2 while one was unseen (g1 reveals its point, free)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'free', seg: [10.5, 24.4], retired: true,
      stem: 'Which plain-English version keeps what Ron means?',
      choices: ['Ruining your health is your right, and that’s good',
                'Ruining your health is sad, but it’s your right',
                'People should eat better, but no one can force them'], a: 0,
      cue: '最後の一言が、許すだけか、ほめているか。',
      line: 'if you want to *eat garbage* … *you can*. … To me, *that’s beautiful*.',
      said: 'ゴミを食べて太り、43歳で倒れるのも自由、と例を出し、最後に「それが美しい」と結ぶ。',
      mean: '「仕方ない」ではなく「すばらしい」。体に悪い選択でも、自分で選べることに価値がある、という本気の主張。',
      trap: '極端な例は、皮肉か渋々の譲歩に聞こえやすい。最後の評価の語が、話し手の本当の立場を決める。',
      use: 'Your life, your choice.（あなたの人生、あなたが決めること）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'doso', seg: [19.5, 22.4],
      stem: 'Type what Ron says: “You are ___.” (4 words)', answer: 'free to do so',
      cue: '「you can」のあと、同じことの言いかえ。',
      line: 'you can. You are *free to do so*.',
      said: '「できる。そうする自由がある」と、同じことを言いかえる。',
      mean: 'to は弱く「タ」に近く、do so とつながる。do so ＝ そうする。少し硬い言い方。',
      trap: 'to が弱く free do so と聞こえやすい。free のあとは to が来やすい。',
      use: 'Feel free to ask me anything.（何でも気軽に聞いてね）' },

    // R fix: blind 55 % (the key was the only two-part answer) and K1 (the ham question is about food); all three are
    //   two-part now, the key says "or", and said no longer names the email and ham questions (d2, d3). Cold re-read
    //   75 % (the only comic choice): the third choice is now comic too
    // why: hostile, then won over ← the nurse challenge and the chant heard as a crowd against her that comes round;
    //   silly, then on topic ← Leslie's "more relevant than usual" heard as praise of how tonight's questions ended
    { id: 'g2', skill: 'gist', level: 'B2', point: 'qa', reveals: ['pretext'], seg: [24.3, 77.5],
      stem: 'Overall, how do the audience’s questions go for Ann?',
      choices: ['Confused about food, or not about food at all', 'Hostile at first, then won over by her facts',
                'Silly about food, then fair and on topic'], a: 0,
      cue: '質問を順に並べて、話がどこへ向かうか。',
      said: '食べ物について的外れな質問が続き、途中から Ann 本人への個人的な頼みに変わる。',
      mean: '説明した内容はほとんど届いていない。質問の中身から、会の様子が分かる。',
      trap: '「本当に看護師？」一つで決めず、質問全体の流れで見る。',
      use: 'Does anyone have any questions?（何か質問はありますか）' },

    // R fix: seg end 38.9 → 39.0, so "terrible" isn't clipped
    // why: agrees ← "yes" read as an answer to the question (Japanese はい); no answer ← the long "uh…" pause heard as
    //   being stuck
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'uhyes', seg: [26.4, 39.0],
      stem: 'Right after the sugar question, what does Ann’s short reply do?',
      choices: ['Calls on the next person', 'Agrees that sugar tastes good', 'Says she has no answer to it'], a: 0,
      cue: '長い「uh」のあと、次に誰が話すか。',
      line: 'how come Jesus made it taste so good? — Uh… *yes*. — *But isn’t all food bad…*',
      said: '砂糖の質問には答えず、少し間をおいて「はい」と言い、次の人が質問を始める。',
      mean: 'この yes は「どうぞ」。手を挙げた次の人を指して、質問を流している。',
      trap: 'yes を質問への「はい」と取りやすい。司会の yes は、次の人を指すことが多い。',
      use: 'Yes, you in the back?（はい、後ろの方どうぞ）' },

    // R fix: blind 55–70 % (only the key was about his story, then only the key had the backfire shape); all three
    //   now start "His own story" and the key is plainer
    // why: boast ← "every day of my life for 40 years" sounds proud; food can't be that bad ← "40 years" of lasagna
    //   heard as surviving fine, without the last words
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lasagna', seg: [31.8, 39.7],
      stem: 'Why is the man’s lasagna question funny?',
      choices: ['His own story supports what she said', 'His own story is a boast about his diet',
                'His own story shows food can’t be that bad'], a: 0,
      cue: '最後の「and I feel …」まで聞く。',
      line: 'I’ve been eating *lasagna and muffins every day* … for 40 years and *I feel terrible*.',
      said: '「全部の食べ物が体に悪いのでは？40年毎日ラザニアとマフィンで、体調は最悪」と聞く。',
      mean: '反論のつもりが、自分の体調で「体に悪い」を証明してしまっている。',
      trap: '毎日40年と聞くと自慢に聞こえるが、オチは最後の一言。質問は最後まで聞いて判断する。',
      use: 'I’ve been doing this every day for years.（何年も毎日これをやってる）' },

    // why: pleased ← "oh boy" heard as excited (as in "Oh boy, presents!"); amused ← "Corn's a fruit" sounds like a
    //   gag, so she might laugh along
    { id: 't2', skill: 'attitude', level: 'B2', point: 'ohboy', seg: [38.95, 46.5],
      stem: 'After the corn syrup question, how does Ann react?',
      choices: ['Worried by how little the man knows', 'Pleased that someone asked about it',
                'Amused, as if it were a friendly joke'], a: 0,
      cue: '「bush」のあと、ため息のような短い一言。',
      line: 'Corn’s a fruit. Syrup comes from a bush. — *Oh, boy.*',
      said: '「コーンは果物、シロップは茂みから取れる」と言われ、Ann は「やれやれ」とつぶやく。',
      mean: 'Oh, boy ＝ 困った、先が思いやられる。boy は男の子ではない。',
      trap: 'Oh boy は喜びにも使うので明るく取りやすい。直前の発言の中身で判断する。',
      use: 'Oh, boy. Here we go again.（やれやれ、またか）' },

    // R fix: blind 70–75 % (the sitcom flirt was the only flirt); all three are requests now, one of them a date
    //   for the asker himself
    // why: proof ← "really a nurse" + "I work at St. Joe's" heard as checking her job; a date with him ← "thinks
    //   you're cute" heard without "my friend", the usual cover story read as the truth
    { id: 'i2', skill: 'infer', level: 'C1', point: 'pretext', seg: [46.5, 55.9],
      stem: 'What was the question about her being a nurse really leading to?',
      choices: ['A request for her phone number', 'A request for proof she works there',
                'A request for a date with him'], a: 0,
      cue: '「Well, the point is」のあとが本題。',
      line: 'you’re really a nurse? … *Well, the point is*, my friend thinks you’re cute. *Give me your number*',
      said: '「本当に看護師？」のあと「要は、友だちが君をかわいいって。番号を」。',
      mean: '最初の質問は前振り。Well, the point is で本題に移る。',
      trap: 'St. Joe’s で仕事の確認と取りやすい。the point is のあとと、誰のためかを聞く。',
      use: 'Anyway, the point is, I need help.（とにかく、要は手伝ってほしいの）' },

    // why: agrees ← "Yeah" at the start heard as a yes; later ← "not gonna happen" heard as "not now"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'refuse', reveals: ['pretext'], seg: [53.65, 61.0],
      stem: 'When she’s asked for her number, what does Ann’s answer do?',
      choices: ['Turns the request down flatly', 'Agrees, but only for the friend', 'Puts him off until later'], a: 0,
      cue: '最初の「Yeah」のあと、文の残り。',
      line: 'Give me your number … — *Yeah, that’s not gonna happen.*',
      said: '番号を求められ、「うん、それはないわ」と返す。',
      mean: 'この Yeah は同意ではない。not gonna happen ＝ ありえない、とはっきり断る。',
      trap: '文頭の Yeah で「はい」と取りやすい。Yeah のあとに否定が来たら、断りとして聞く。',
      use: 'Yeah, that’s not gonna happen.（うん、それは無理）' },

    // why: mailing address ← "address" is said, and "email" is short and weak before it; work number ← the number
    //   request just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'email', seg: [55.8, 61.0],
      stem: 'What does the next person ask Ann for?',
      choices: ['Her email address', 'Her mailing address', 'Her work number'], a: 0,
      cue: '「address」の前の短い一語。',
      line: 'Can I have your *email address*? I just got on AOL.',
      said: '「メールアドレスを教えて。AOL を始めたばかり」と頼み、Ann は「いや」と断る。',
      mean: 'AOL は昔のネット接続サービス。今度はメールで連絡先を聞こうとしている。',
      trap: 'address だけ拾うと住所になる。直前の短い語 email まで聞く。',
      use: 'Can I get your email address?（メールアドレスを教えてもらえますか）' },

    // R fix: K6, the key was the only choice without "mayonnaise"; all three have it now. Its line shows "ought to", so
    //   it reveals the new s2
    // why: put in ← "bars … and eat ham and mayonnaise" run together; eat them with ← "throw those bars out" missed,
    //   keeping only "eat"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ham', reveals: ['ought'], seg: [60.4, 65.3],
      stem: 'What does the next person suggest doing about the bars?',
      choices: ['Swap them for ham and mayonnaise', 'Put ham and mayonnaise in the bars',
                'Eat them with ham and mayonnaise'], a: 0,
      cue: 'bars の直後の短い語と、そのあとの動詞。',
      line: 'we ought to *throw those bars out* and eat *ham and mayonnaise sandwiches*.',
      said: '「バーは捨ててハムマヨのサンドイッチを食べよう」と言われ、Ann は止める。',
      mean: 'throw out ＝ 捨てる。代わりに、もっと脂っこい物を勧めている。',
      trap: 'out が弱く bars and eat がつながる。throw の後の out まで聞く。',
      use: 'Let’s throw out the old milk.（古い牛乳は捨てよう）' },

    // R new: replaces s1 (sound). Both sources have "ought to"; blind read 35 %
    // why: got to ← the flapped t is the same, only the first vowel differs (オーダ / ガラ); want to ← "wanna" carries
    //   the same suggestion in the same rhythm
    { id: 's2', skill: 'sound', level: 'B2', point: 'ought', seg: [60.4, 64.2],
      stem: 'Fill the gap: “I think we ___ throw those bars out.”',
      choices: ['ought to', 'got to', 'want to'], a: 0,
      cue: '「I think we」のあと、弱くつながる2語。',
      line: 'I think we *ought to* throw those bars out',
      said: '「あのバーは捨てるべき」と提案。ought to は「オーダ」と一続き。',
      mean: 'ought to ＝ 〜したほうがいい。should に近い提案の形。',
      trap: 'got to も t が弾んで「ガラ」と似た音になる。頭の母音が「オー」か「ガ」かを聞く。',
      use: 'We ought to leave soon.（そろそろ出たほうがいいね）' },

    // why: Leslie to Ann ← both voices are women's, and Leslie is the one who speaks next; a man ← the crowd has just
    //   been chanting
    { id: 'w1', skill: 'who', level: 'B2', point: 'week', reveals: ['usual'], seg: [71.4, 77.5],
      stem: 'Who says “I can’t believe you do this every week”, and to whom?',
      choices: ['Ann, to Leslie', 'Leslie, to Ann', 'A man in the crowd, to Ann'], a: 0,
      cue: '返事の中身から、毎週やっているのは誰か。',
      line: 'I can’t believe *you do this every week*. — I’m actually encouraged…',
      said: '「これを毎週やってるなんて」と言われ、相手は「手ごたえあり」と返す。',
      mean: '毎週会を開くのは Leslie。今日が初回の Ann が Leslie に言っている。',
      trap: 'どちらも女性の声で区別しにくい。you が誰を指すかを、返事の内容から決める。',
      use: 'I can’t believe you do this every day.（これを毎日やってるなんて）' },

    // anchor: 71.9–73.3 s both sources have "I can't believe you do this every week": 8 words in ≈ 1.4 s, with "you
    //   do" run together
    // retired: one C2 alone is under 2 (nt1 retired; it shares w1's point, week)
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'week', seg: [71.4, 77.5], retired: true,
      stem: 'Type the words: “I can’t ___ every week.” (4 words)', answer: 'believe you do this',
      cue: '「can’t」のあと、速く弱い4語。',
      line: 'I can’t *believe you do this* every week.',
      said: '「これを毎週やってるなんて」。4語がつながり、you は「ヤ」、do も弱い。',
      mean: '毎週の習慣なので、過去形でなく現在形の do。驚きにも呆れにも使う形。',
      trap: '終わった会の話なので did と書きたくなる。every week ならくり返しの do。',
      use: 'I can’t believe you made this yourself!（これ自分で作ったなんて！）' },

    // R drop s1 (sound): "encouraging" was out by grammar and "discouraged" by the next sentence, so meaning, not
    //   sound, settled it; never shipped, deleted. Replaced by s2
    // R fix: blind 60 % ("smaller crowds" answered another question); now "just as bad", refuted by "more … than"
    // why: more on topic ← "relevant" heard alone, without "more … than usual"; just as bad ← "than usual" heard as
    //   "as usual"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'usual', seg: [71.4, 77.5],
      stem: 'What does Leslie’s last line suggest about her own forums?',
      choices: ['The questions are usually even worse', 'The questions are usually more on topic',
                'The questions are usually just as bad'], a: 0,
      cue: '比べる言い方「more … than」のあと。',
      line: 'The questions were *more relevant than usual*.',
      said: '「今日の質問は、いつもより的を射ていた」と言う。',
      mean: 'あの質問で「いつもよりまし」なら、普段はもっとひどい。',
      trap: 'relevant だけ拾うと「普段は的を射ている」と逆に取る。than のあとの比べる相手まで聞く。',
      use: 'That went better than usual.（いつもよりうまくいった）' },

    // R drop nt2 (C2 humor): K1, the laugh is also on tonight's crowd (absurd questions called "relevant"), so "Tonight's
    //   crowd" is defensible; the rest repeats i3 on the same point. Never shipped, deleted
  ]
};
