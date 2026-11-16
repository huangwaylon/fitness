// “Michael Wasn't Invited To The Retreat - The Office US” (the official The Office channel, BEST OF SEASON 4 - The
// Office US): Toby is back from Ryan's weekend in the woods with some branch managers and can't stop talking about it;
// the comments to the camera keep saying Michael wasn't invited, and Michael finally cuts Toby off.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael, Ryan, Toby (13.8 s, 39 s).
// Untested: 3.9–6.2 s ("I love camping. Anything can happen.": speaker unknown); 10.4–11.2 s ("Morning. Michael."); the
// names in the list at 44.6–48.9 s (captions "damn from Buffalo", whisper "Dan"); 30 s "Bob" (who he is is backstory);
// 76.3–99 s is silent, then whisper loops "I'm going to go on to the next one" (not in the captions).
// EAR CHECK: 1 s, 7 s, 44.6 s, 60 s t1 x1 g2 t2 d5 m1 d4 — the trip-goer who talks is assumed Toby (44.6 s "Me,
//   … and Ryan" fits only Toby, since "Toby went"; the other lines are taken as the same voice)
// EAR CHECK: 67.3–74 s g1 p1 i2 f3 nt2 — "Hey, nobody cares… wrap it up" is assumed Michael's (he isn't named; the
//   speaker needs "that room", and the clip's last line is "Michael wasn't invited")
// REVIEW 2026-11-16: pass 4, fix 17, drop 1, new 0; ear checks 2
//   open: nt1 and i1 share the point "knew" and are now close cousins (the C2 asks for the joke, the C1 for the
//   meaning); if one has to go, drop nt1 and find another C2 line
import type { Clip } from '../types.ts';

export const retreat: Clip = {
  id: 'retreat', video: 'DwDIedpf6wA', title: 'Michael Wasn\'t Invited To The Retreat - The Office US', dur: 99,
  wpm: 189, band: 'fast', tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %: "pleasantly surprised" was the only positive feeling); all three are now feelings
    //   measured against what he expected, so the -n't and the "but I did" decide it
    // why: let down ← "didn't think… a good time" heard without the "but I did" after it; as expected ← the -n't of
    //   "didn't think" lost, giving "I really thought I'd have a good time, and I did"
    { id: 't1', skill: 'attitude', level: 'B1', point: 'goodtime', seg: [0.6, 3.9],
      stem: 'How does Toby sound about the weekend in his first line?',
      choices: ['Delighted; better than he expected', 'Let down; it was worse than he’d hoped',
                'Satisfied; about as good as he expected'], a: 0,
      cue: 'but のあとの短い文と、そのくり返し。',
      line: 'I really didn’t think I was going to have a good time, *but I did. I totally did.*',
      said: '「楽しめるとは思ってなかった。でも楽しかった。本当に」と言う。',
      mean: '期待していなかった分、うれしい驚き。totally で強めている。',
      trap: 'didn’t の t が消えると「思った通り」に、前半だけだと不満に聞こえる。n’t と but の両方を聞く。',
      use: 'I didn’t expect to like it, but I did.（好きになると思わなかったけど、なった）' },

    // R fix: B/test: answer's apostrophe matched to the line's ’ (the dict test compares them)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'goodtime', seg: [0.6, 3.0],
      stem: 'Type what Toby says: “I really ___ have a good time.” (6 words)',
      answer: "didn't think i was going to",
      cue: 'really のあと、速くつながる6語。',
      line: 'I really *didn’t think I was going to* have a good time',
      said: '「楽しめるとは思っていなかった」と言う。',
      mean: 'didn’t の t はほぼ消え、I was going to は弱く速い。6語が一息に聞こえる。',
      trap: 'didn’t の「ン」を聞き落とすと逆の意味になる。was も弱く、落としやすい。',
      use: 'I didn’t think I was going to make it.（間に合わないと思ってた）' },

    // R fix: V2 (blind 75 %: apologizing and complaining clashed with "a weekend he loved"); the distractors are now
    //   upbeat too: an invitation built on "You should come", and a dig built on the title
    // why: inviting ← "You should come" (28.8 s) heard as the point of all his talk; rubbing it in ← the comments to
    //   the camera and the title say Michael wasn't invited, but Toby himself never brings it up
    { id: 'g2', skill: 'gist', level: 'B2', point: 'share', reveals: ['goodtime', 'stars'], seg: [0.6, 67.2],
      stem: 'Across the scene, what is Toby mainly doing?',
      choices: ['Telling everyone about a weekend he loved', 'Inviting everyone to come on the next trip',
                'Rubbing it in that Michael wasn’t asked'], a: 0,
      cue: '最初の一言と、最後の amazing のあたり。',
      said: '思ったより楽しかった、星の下で寝た、と話し続ける。',
      mean: '週末の思い出を話したくてしかたがない。周りの反応は気にしていない。',
      trap: 'You should come が残ると誘いに聞こえる。一度の一言より、くり返す amazing を聞く。',
      use: 'You have to hear about my trip!（旅行の話、聞いてよ！）' },

    // R fix: V2 (blind 60 %: "unsure what to call it" was a weak hedge); now "like work", the 研修 reading of retreat
    // why: play down ← correcting a word heard as modesty (謙遜: "it wasn't really camping"); like work ← "retreat"
    //   read as a company 研修, but it's a "wilderness" retreat and he's delighted with it
    { id: 't2', skill: 'attitude', level: 'C1', point: 'retreatword', seg: [3.4, 10.2],
      stem: 'When the trip is called camping, what does Toby’s correction suggest?',
      choices: ['He wants it to sound grander than camping', 'He wants to play down how much fun it was',
                'He wants it to sound like work, not a holiday'], a: 0,
      cue: 'Oh のあと、言いかえた名前の長さ。',
      line: 'I love camping. — Oh, *it wasn’t camping*. It was more of a *wilderness retreat*.',
      said: '「キャンプ好きだよ」に「キャンプじゃない。むしろ大自然の合宿」と言い直す。',
      mean: 'ただのキャンプより立派な名前にしたい。特別な集まりだったと言いたい。',
      trap: '言い直しを謙遜、retreat を研修と取りやすい。大きな名前に変えている点を聞く。',
      use: 'It’s not a hotel, it’s more of a resort.（ホテルというより、リゾートかな）' },

    // R fix: V2 (blind 70 %: the title rules out "Michael and…", and "the whole office" was off the scale); now
    //   some/all and and/not, the words that are said quickly
    // why: his office ← "get-to-know-you weekend" sounds like team-building for the office; all but Toby ← "some of
    //   the" lost (all), and "and Toby" heard as "not Toby"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'guests', seg: [11.3, 19.2],
      stem: 'Who did Ryan invite into the woods?',
      choices: ['Some of the branch managers, and Toby', 'All the branch managers, but not Toby',
                'Toby and a few people from his office'], a: 0,
      cue: 'invited のすぐあとの人たち。',
      line: 'Ryan invited *some of the branch managers and Toby* into the woods',
      said: '「Ryan が支店長の何人かと Toby を森に招いた」と話す。',
      mean: '招待は一部の人だけ。続けて「Michael は呼ばれなかった」と言う。',
      trap: '速い some of the を落とすと「全員」に聞こえる。and と not も短い。小さな語を聞く。',
      use: 'She invited some of her coworkers.（同僚の何人かを招いた）' },

    // R fix: V2 (blind 55 %: "outdoor skills" was weak); now "get to know the woods", the keyword trap
    // why: the woods ← "get to know" heard, then "the woods" just before, joined as one idea; planning ← branch
    //   managers meeting suggests business
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'gtky', seg: [11.3, 16.6],
      stem: 'What kind of weekend was it meant to be?',
      choices: ['One for people to get to know each other', 'One for getting to know the woods',
                'One for managers to plan the year ahead'], a: 0,
      cue: 'weekend の前の、ハイフンでつながった長い語。',
      line: 'into the woods for a *get-to-know-you weekend*',
      said: '「お互いを知るための週末」に森へ行った、と話す。',
      mean: 'get-to-know-you ＝ 親しくなるための。語をつないで形容詞にしている。',
      trap: 'woods の直後なので「森を知る」と結びやすい。最後の you が、相手は人だと示す。',
      use: 'Let’s have a get-to-know-you lunch.（親睦ランチをしよう）' },

    // R fix: V2 (blind 55 %: with the title, "who is the joke on?" answers itself as Michael); now "what is the
    //   joke?", with three readings of the same knowing, each wrong in one way the words settle
    // anchor: 20.9–23.7 s "they already knew everything they needed to know about him": the subject is "they" (the
    //   people who went), the thing known is "him", and it comes right after "Michael wasn't invited" on a
    //   "get-to-know-you weekend"
    // why: old friends ← "already knew" heard without "about him", as the guests knowing each other; Michael's
    //   view ← the knowing turned around, as if he thinks they know him
    // retired: for the draws: play 3+ drew no C2 while one was unseen; it shares i1's point (knew), and the review
    //   would drop it first
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'knew', reveals: ['guests', 'gtky'], seg: [11.3, 24.1], retired: true,
      stem: 'What is the joke in the comment about what “they needed to know”?',
      choices: ['Getting to know Michael is why he was skipped', 'A get-to-know-you trip went to old friends',
                'Michael thinks they know him, but they don’t'], a: 0,
      cue: '文の主語と、最後の about のあとの語。',
      line: 'Michael wasn’t invited. … Apparently, they already knew everything they needed to know *about him*.',
      said: '「Michael は呼ばれず。彼のことはもう全部知っていたらしい」と話す。',
      mean: '親しくなる会に呼ばない理由が「もう知っている」。知った結果がよくない、という皮肉。',
      trap: 'already knew だけだと仲間どうしの話に聞こえる。知っているのは they、知られているのは him。',
      use: 'I’ve seen enough of his cooking.（彼の料理はもう十分見た）' },

    // R fix: V2 (blind 60 %: "too well" was the only pointed reading, "by mistake" a filler); now three readings of
    //   who knew what, and how much
    // why: too little ← "needed to know" heard as "still needed to know", the "already" lost; he knew everyone ←
    //   the knowing turned around: "they… knew… about him" heard as Michael knowing them
    { id: 'i1', skill: 'infer', level: 'C1', point: 'knew', seg: [17.2, 24.1],
      stem: 'What is the comment after “Michael wasn’t invited” really saying?',
      choices: ['They knew enough about him to leave him out', 'They knew too little about him to ask him',
                'He knew them all, so he had no need to go'], a: 0,
      cue: 'they が何を知っていて、それが誰についてか。',
      line: 'Apparently, *they already knew everything they needed to know about him*.',
      said: '「彼について知るべきことは、もう全部知っていたらしい」と言う。',
      mean: '親しくなる会に呼ぶ必要がない ＝ もう十分知っていて来てほしくない、という皮肉。',
      trap: 'already を落とすと「まだ知らない」に、主語を逆にすると Michael 側の話になる。',
      use: 'I think I know all I need to know.（もう十分分かったと思う）' },

    // why: cabins ← the question's own word, heard as the answer; a lodge ← "woods" and "retreat" suggest a building
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stars', seg: [24.1, 27.6],
      stem: 'Where did they sleep on the trip?',
      choices: ['Outside in the open', 'In wooden cabins', 'In a lodge nearby'], a: 0,
      cue: 'cabins? という質問への、短い答え。',
      line: 'Did you sleep in cabins? — *Under the stars.*',
      said: '「小屋で寝たの？」に「星の下で」と答える。',
      mean: 'under the stars ＝ 屋根のない外で。寝る場所の答えとしてよく使う。',
      trap: '質問の cabins がそのまま耳に残りやすい。答えは質問とは別の場所。',
      use: 'We slept under the stars.（星空の下で寝た）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'stars', seg: [24.1, 27.6],
      stem: 'Type the answer to “Did you sleep in cabins?” (3 words)', answer: 'under the stars',
      cue: '質問のすぐあとの短い答え。',
      line: 'Did you sleep in cabins? — *Under the stars.*',
      said: '「小屋で？」に「星の下」と返す。',
      mean: 'the が弱く「アンダザスターズ」のようにつながる。star のあとに s が付く。',
      trap: 'the を落としやすく、stars の s も消えがち。前置詞＋the＋複数形で3語。',
      use: 'Dinner under the stars sounds nice.（星空の下のディナー、いいね）' },

    // R fix: V2 (blind 50 %: "warning it sounds risky" was a filler); now a polite refusal, the Japanese frame of
    //   answering an invitation sideways
    // why: come along ← "You should come" just before, heard as being answered; turning down ← an off-topic answer to
    //   an invitation read as a 遠回しな断り, but nothing in it says no
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'rock', seg: [27.4, 32.8],
      stem: 'What is the rock climbing remark doing in the conversation?',
      choices: ['Adding an only loosely related story', 'Asking to come along on the next trip',
                'Politely turning down the invitation'],
      a: 0,
      cue: 'once で終わる文が、何の話をしているか。',
      line: 'You should come. — *Bob and I took rock climbing lessons once.*',
      said: '「来るといいよ」に「Bob と一度ロッククライミングを習った」と話す。',
      mean: '話の流れに、少しだけ関係のある自分の思い出を足している。',
      trap: '直後なので返事に聞こえる。返事なら I’d love to など、はい・いいえが来る。',
      use: 'That reminds me, I tried surfing once.（そういえば、サーフィンを一度やったよ）' },

    // R fix: V2 (blind 65 %: "feels sorry for him" was a filler) and S1 (the stem named a talking head, a picture
    //   fact); the stem now quotes the moment, and the new distractor is the half-heard first sentence
    // why: mix-up ← the names Toby and Michael flip quickly; his choice ← "Michael didn't go" heard without the "He
    //   wasn't invited" that follows
    { id: 'h1', skill: 'humor', level: 'C1', point: 'repeat', reveals: ['didntgo'], seg: [35.5, 43.4],
      stem: 'Why is the “Toby went…” comment funny?',
      choices: ['It says one plain fact three times over', 'It mixes up which man went and which didn’t',
                'It makes it sound as if Michael chose not to go'], a: 0,
      cue: '3つの文が、それぞれ何を言っているか。',
      line: 'Michael wasn’t invited on Ryan’s camping trip. *Toby went, but Michael didn’t go. He wasn’t invited.*',
      said: '「Toby は行った、Michael は行かなかった。呼ばれなかった」と話す。',
      mean: '同じ事実を言い方を変えて3回。わざとくり返して、楽しんでいる。',
      trap: '名前の入れ替わりで混乱に、didn’t go だけだと本人の選択に聞こえる。最後の文まで聞く。',
      use: 'I said no. N-O. No.（ダメって言ったの。ダメ）' },

    // R fix: S4: the segment was 2.8 s (< 3 s); it now starts at the sentence before (35.6 s), still ending before
    //   "He wasn't invited"
    // why: didn't know ← go/know, the same vowel after a weak "didn't"; didn't mind ← fits "but" and the calm voice;
    //   doesn't know ← the -n't with a present form, heard in a fast stretch
    { id: 's1', skill: 'sound', level: 'B2', point: 'didntgo', seg: [35.6, 41.6],
      stem: 'Fill the gap: “Toby went, but Michael ___.”',
      choices: ['didn’t go', 'didn’t know', 'didn’t mind', 'doesn’t know'], a: 0,
      cue: 'but Michael のあと、最後の短い語。',
      line: 'Toby went, but Michael *didn’t go*.',
      said: '「Toby は行ったが、Michael は行かず」と言う。',
      mean: 'went と didn’t go の対比。didn’t の t は消えて「ディドン」。',
      trap: 'go と know は母音が同じで、弱い didn’t のあとでは似る。went と対で考える。',
      use: 'She went, but I didn’t go.（彼女は行ったけど、私は行かなかった）' },

    // R fix: V2 (blind 75 %) and S4 (the key's "managers" is said at 12 s, outside the segment); the choices now
    //   turn on what the segment says: "from" + a town, and "and Ryan"
    // why: his own office ← Toby is from this office, so his group sounds like coworkers; not Ryan ← the list's last
    //   name, tacked on after a pause, missed
    { id: 'd5', skill: 'detail', level: 'B2', point: 'guests', seg: [43.5, 50.3],
      stem: 'Besides Toby, who went on the trip?',
      choices: ['Men from other cities, and Ryan', 'Men from Toby’s own office, and Ryan',
                'Men from other cities, but not Ryan'], a: 0,
      cue: 'from のあとの町の名前と、最後の名前。',
      line: 'Who went? — Me, Dan *from Buffalo*, Mark Chisholm, Jack *from Albany*, *and Ryan*',
      said: '「誰が？」に「僕と、バッファローの Dan、…、それに Ryan」と答える。',
      mean: '町の名前付きなのは、よその支店の人だから。最後に Ryan を足す。',
      trap: '名前は全部聞かなくていい。from ＋ 町の名前がよその人の合図。最後の名前まで聞く。',
      use: 'This is Ken from the Osaka office.（大阪支社の Ken です）' },

    // why: noticed ← "obvious" = easy to see; best time ← "obviously" heard as clearly, judging how he looked
    { id: 'm1', skill: 'marker', level: 'B2', point: 'obviously', reveals: ['guests'], seg: [43.5, 50.3],
      stem: 'What does the word after Ryan’s name add?',
      choices: ['That of course he went; it was his trip', 'That he was the one people noticed most',
                'That he clearly had the best time of all'], a: 0,
      cue: '名前のあとに付け足した一語。',
      line: '…Jack from Albany, and *Ryan, obviously*.',
      said: '行った人を並べ、最後に「それと Ryan、当然ね」と付け足す。',
      mean: 'obviously ＝ 言うまでもなく。Ryan が招いた本人なので、いて当然。',
      trap: 'obvious を「目立つ」と取ると別の意味になる。名前のあとなら「もちろん」。',
      use: 'And me, obviously.（あと私もね、もちろん）' },

    // why: ran out ← "no more" heard as none left; nobody wanted ← "had to say" heard as the snack being turned down
    { id: 'd4', skill: 'detail', level: 'B1', point: 'smores', seg: [49.9, 56.0],
      stem: 'Why did Toby finally have to say what he said about s’mores?',
      choices: ['They had eaten far too many', 'They had run out of them', 'Nobody wanted to eat them'], a: 0,
      cue: 'We had so 〜 のあと。',
      line: 'We had *so many s’mores* I finally had to say, “No more s’mores.”',
      said: '「スモアを食べすぎて、『もうスモアはなし』と言うしかなかった」と話す。',
      mean: 'so many 〜 ＝ あまりに多くて…。食べすぎて止めた、という話。',
      trap: 'no more を「もうない」と取ると、なくなった話になる。前の so many が理由。',
      use: 'I ate so much I had to lie down.（食べすぎて横になるしかなかった）' },

    // R drop: h2, V2 (blind 70 %): anyone who knows the word s'mores can see the no more / s'mores rhyme from the
    //   choices, and no rewrite of the distractors hides it; d4 keeps the point. Never shipped, so deleted.

    // R fix: V2 (blind 80 %: the title and the other items made "cuts him off" the only fit); all three choices now
    //   cut in, for three different reasons
    // why: next trip ← "You should come" earlier heard as Michael's wish; needs the room now ← "I need that room"
    //   heard without "at some point"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reaction', reveals: ['wrapup', 'room'], seg: [58.5, 76.3],
      stem: 'How does Michael respond while Toby tells the story?',
      choices: ['He cuts Toby off and tells him to finish', 'He cuts in to ask to go on the next trip',
                'He cuts in because he needs the room now'], a: 0,
      cue: 'experience のすぐあと、話をさえぎる声。',
      said: '「すばらしい体験」の途中で「誰も気にしてない。部屋を使うから終わらせて」とさえぎる。',
      mean: '話を聞く気はなく、早く終わらせたい。',
      trap: 'need that room だけだと急ぎに聞こえる。at some point で判断する。',
      use: 'Sorry to cut you off, but we’re out of time.（さえぎってごめん、時間なの）' },

    // R fix: V2 (blind 50 %: "seem" in the stem hinted at a pretext) and K5 ("for the rest of the day" answered how
    //   long, not how soon); now three points on one how-soon scale, and V5 C1 → B2 (one common phrase)
    // why: right away ← "need that room" heard without "at some point"; few minutes ← "just wrap it up" heard as
    //   the deadline for the room
    { id: 'i2', skill: 'infer', level: 'B2', point: 'room', seg: [66.8, 74.5],
      stem: 'From his words, how soon does Michael need the room?',
      choices: ['Right away, this minute', 'In the next few minutes', 'Some time; there’s no rush'], a: 2, keep: true,
      cue: 'room のあとの、時を表す3語。',
      line: 'I need that room *at some point*, so just wrap it up.',
      said: '「いつかその部屋が要るから、まとめて」と言う。',
      mean: 'at some point ＝ いつか。急ぐ理由はなく、話を止める口実だと分かる。',
      trap: 'need や wrap it up だけ聞くとすぐ必要に聞こえる。時を表す語が、本当の急ぎ具合を示す。',
      use: 'I need to call her at some point.（いつか彼女に電話しないと）' },

    // R fix: V2 (blind 70 %: "offering more time" was a filler) and V5 B2 → C1 (the pretext is implicit stance);
    //   the distractors are now the literal reading and a polite "take it elsewhere"
    // why: real need ← the words taken at face value; somewhere else ← "I need that room" read as a polite request
    //   to move, but "wrap it up" means end it, and "nobody cares" is anything but polite
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'room', seg: [66.8, 74.5],
      stem: 'What is Michael’s line about the room doing?',
      choices: ['Giving a cover reason to stop the story', 'Explaining a real need for the room',
                'Asking Toby to go on somewhere else'], a: 0,
      cue: 'nobody cares の直後の言い方。',
      line: 'Nobody cares. *I need that room* at some point, *so just wrap it up*.',
      said: '「誰も気にしてない。部屋を使うから、まとめて」と言う。',
      mean: '部屋の話は口実で、Toby の話を止めたい。直前の nobody cares が本音。',
      trap: '言葉どおりだと部屋の都合の話になる。理由の前の本音と、so just のあとが言いたいこと。',
      use: 'I have a call soon, so let’s wrap up.（もうすぐ電話があるので、終わりにしよう）' },

    // R fix: V2 (blind 55 %: the key was the only reply that read a feeling); "dull" becomes "so busy", a second
    //   feeling-reading that "at some point" rules out
    // anchor: 67.3–69.8 s "Hey, nobody cares. Nobody cares.", 71.4 s "at some point" (no hurry), then 75.3 s "Michael
    //   wasn't invited" said once more: the words give the room no urgency and put the trip, not the time, at issue
    // why: booking ← the room taken at face value (the literal reading); busy ← the cut-off read as stress over
    //   work, a real but wrong feeling: "at some point" says there's no rush
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'room', seg: [66.8, 76.3], retired: true,
      stem: 'Which reply from Toby would show he understood Michael?',
      choices: ['Sorry. Sore subject, I guess.', 'Sure. What time do you need it?', 'Sorry. Didn’t know you were so busy.'],
      a: 0,
      cue: '急がない部屋の話と、最後の一言。',
      line: 'Hey, *nobody cares*. … I need that room *at some point*… — Michael wasn’t invited.',
      said: '「誰も気にしてない」と2回言い、急がない部屋を口実に話を止める。',
      mean: '本当に気にしていないなら止めない。呼ばれなかった痛みへの反応で、それに気づいた返事が合う。',
      trap: '部屋の話を言葉どおりに、いら立ちを忙しさと取りやすい。急がない用事で人を止めたら、話題が痛いと疑う。',
      use: 'Sorry, I didn’t mean to rub it in.（ごめん、追い打ちするつもりはなかった）' },

    // R fix: V2 (blind 55 %) and K1 ("keep the story to himself" is close to what Michael wants, so defensible);
    //   now "save it for later", which "just wrap it up" (end it now) rules out; V5 B1 → B2 (a common idiom)
    // why: pack up ← wrap = 包む, and "room" just before, as in clearing out; later ← "at some point" heard as "you
    //   can finish it some other time"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'wrapup', seg: [70.2, 74.5],
      stem: 'What does Michael tell Toby to do at the end?',
      choices: ['Bring what he’s saying to an end', 'Pack up his things and leave the room',
                'Save the rest of the story for later'], a: 0,
      cue: 'so just のあとの3語。',
      line: 'so just *wrap it up*.',
      said: '「だから、さっさと終わらせて」と言う。',
      mean: 'wrap it up ＝ 話や会議を終わらせる。仕事の場でよく使う。',
      trap: 'wrap を「包む」と取ると片づけに、at some point に引かれると「あとで」に聞こえる。',
      use: 'Can you wrap it up in five minutes?（5分でまとめてもらえる？）' },
  ]
};
