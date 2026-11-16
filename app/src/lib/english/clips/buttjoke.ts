// REVIEW 2026-11-16: pass 9, fix 12, drop 0, new 0; ear checks 1
// “Butt of the Joke (Episode Highlight) | Parks and Recreation” (the official Parks and Recreation channel, Season 2):
// Jerry comes back to the office to a "Jerry Day", asks only for things to go back to normal, and his presentation on
// hunting licenses goes wrong in small ways (unplugged computer, a vacation photo, "twout", lost glasses).
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: the joke banner itself (0–3 s, only
// on screen), Tom's "support" / "bra for a man" jab (37.8–46 s; a body joke, never asked about, though it sits inside
// g2's segment), the "closed season on twout" line at 88.4 s (captions "12"), and 102.7–120 s (music; whisper loops
// "You know what?"). d1/i2's line has whisper's "have everything go back to normal" (captions "him everything"); the
// key words "go back to normal" agree.
// EAR CHECK: 25.5 s i2 — “That sounds good to me” and “I believe you were going to do a presentation” are one (male)
//   voice; the captions run them together, and Jerry answers “Yes, sir”. i2 no longer depends on who it is
import type { Clip } from '../types.ts';

export const buttOfJoke: Clip = {
  id: 'buttjoke', video: '2xui7lx4wvE', title: 'Butt of the Joke (Episode Highlight)', dur: 120, wpm: 157,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): "proper one" in the key echoed the stem's frame and "worried" was weak; now three readings
    //   of the same two lines
    // why: amused ← "ha-ha… really funny" taken at face value; confused ← "Where's the real banner?" heard as her not
    //      knowing the joke one is a joke
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'banner', seg: [0, 4.4],
      stem: 'How does the first speaker react to the banner the others made?',
      choices: ['Amused: she laughs along with the joke', 'Confused: she thinks theirs is the real one',
                'Unamused: she wants the real one put up'], a: 2,
      cue: '最初の「ha-ha」と、そのすぐあとの質問。', line: 'Ha-ha, guys, *really funny*. *Where’s the real banner?*',
      said: '「はは、面白いね」と言ってから、「で、本物の横断幕はどこ？」と聞く。',
      mean: 'ほめ言葉の形の皮肉。「本物は？」と聞くことで、これは使えないと伝えている。',
      trap: 'ha-ha や funny を文字どおり取りやすい。皮肉かどうかは、直後に何を求めるかで決まる。',
      use: 'Very funny. Now where’s the real one?（面白いね。で、本物は？）' },

    // why: half an hour ← "had an" runs together and sounds like "half an"; an hour and a half / two hours ← the usual
    //      time a banner would take, if "only" is missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [0, 4.4],
      stem: 'How much time do the others say they had?',
      choices: ['Half an hour', 'An hour', 'An hour and a half', 'Two hours'], a: 1, keep: true,
      cue: '「real banner?」への返事、only のあと。', line: 'We *only had an hour*.',
      said: '本物はどこかと聞かれ、「1時間しかなかったんだ」と言い訳する。',
      mean: 'only had ＝ 〜しかなかった。時間が足りなかった、という言い訳の型。',
      trap: 'had an は「ハダン」とつながり、half an に聞こえやすい。only のあとを一続きで聞く。',
      use: 'We only had an hour to pack.（荷造りに1時間しかなかった）' },

    // R fix: V2 (blind 60 %): the key was the only judgement; now all three start with "So did I" and differ after it
    // why: understands ← "So did I" heard as sympathy (the 共感 frame); less time ← "So did I" missed, "Look what I did"
    //      heard as doing better with less
    { id: 'i1', skill: 'infer', level: 'C1', point: 'sodidi', reveals: ['hour', 'banner'], seg: [0, 7.0],
      stem: 'When the others say how little time they had, what does the reply suggest?',
      choices: ['She had an hour too, so she understands', 'She had an hour too, so that’s no excuse',
                'She had even less time, and did better'], a: 1,
      cue: '言い訳への短い返事と、そのあとの一文。', line: 'We only had an hour. — *So did I.* *Look what I did.*',
      said: '「1時間しかなかった」に、「私もね。で、私がやったのを見て」と返す。',
      mean: '同じ1時間でちゃんと作れた、と見せて言い訳をつぶしている。',
      trap: 'So did I を「私も困った」という共感と取りやすい。後ろの Look what I did で向きが分かる。',
      use: 'So did I, and I still finished.（私もそうだったけど、終わらせたよ）' },

    // R fix: V2 (blind 60 %): "put both up" was weak and the stem's "got the point" favoured a concession; now the
    //   native-tier stem ("match what she meant") and a reply to the line's form (thanks for her banner)
    // why: ran out too ← "So did I" heard as sympathy (the 共感 frame); thanks ← "Look what I did" answered as a favour,
    //      the form of the line and not what she did with it
    // anchor: 2.0–6.6 s "Where's the real banner?" — "We only had an hour." — "So did I. Look what I did.": the same hour,
    //         and she shows what she made in it, so the excuse fails
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'sodidi', reveals: ['hour', 'banner'], seg: [0, 7.0],
      stem: 'Which reply from the others would match what she meant?',
      choices: ['Okay, fair. We could have done better.', 'Oh no, so you ran out of time too?',
                'Oh, so you made the real one? Thanks!'], a: 0,
      cue: '言い訳への返事と、そのあと見せるもの。',
      line: 'Where’s the real banner? — We only had an hour. — *So did I. Look what I did.*',
      said: '本物を求められ「1時間しかなかった」と言うと、「私もよ。私がやったのを見て」と返される。',
      mean: '同じ条件でできたと見せるのは「言い訳にならない」の遠回しな形。分かったなら、認める返事になる。',
      trap: 'So did I を共感と聞きやすい。返事は言葉の形でなく、相手のしたことに返す。',
      use: 'I had the same time, and look.（同じ時間で、ほらこれ）' },

    // why: party ← "Jerry Day… whatever you want, anything at all" heard as the outcome; overruled ← "I believe you were
    //      going to do a presentation" heard as a boss saying no
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', reveals: ['normal', 'worktime'], seg: [7.0, 31.5],
      stem: 'How does the plan for Jerry’s first day back turn out?',
      choices: ['He picks a party, and work is put off', 'Someone overrules him, and work goes on',
                'He asks for a usual day, and work goes on'], a: 2,
      cue: '最初の提案と、Jerry 本人の答え。',
      said: '「今日はジェリーの日、何でもしよう」と言われ、Jerry は「普段どおりがいい」と答える。',
      mean: '特別扱いを本人が断り、すぐに予定の発表へ戻る流れ。',
      trap: '発表を求める声を「却下」と取りやすいが、その前に本人の希望に「いいね」と答えている。',
      use: 'Honestly, I just want a normal day.（正直、普通の一日がいい）' },

    // why: causes problems ← "trouble" read as 迷惑, so a complaint; did it wrong ← "should not have" read as blame
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'trouble', seg: [11.2, 17.5],
      stem: 'When Jerry sees the welcome, what does his first reaction mean?',
      choices: ['This is a lot more than I expected', 'This puts me in a difficult spot',
                'You went about this the wrong way'], a: 0,
      cue: '「my gosh」のあとと、返ってくる答え。',
      line: 'my gosh, you *should not have gone to all this trouble*. — Oh, it’s no trouble for our buddy.',
      said: '「こんなに手間をかけなくてよかったのに」と言い、「仲間のためなら」と返される。',
      mean: 'お礼の決まり文句。「そこまでしてくれて」という喜び。',
      trap: 'should not や trouble を文句と取りやすい。返事の no trouble でお礼と分かる。',
      use: 'Oh, you shouldn’t have! Thank you.（そんな、いいのに！ありがとう）' },

    // R fix: V2 (blind 50 %): "go home and rest" was weak; now a near phrase ("go back to work")
    // why: back to work ← "go back to" heard, "normal" lost, and work is where the scene goes next; normal lunch ←
    //      "normal" heard in the wrong place
    { id: 'd1', skill: 'detail', level: 'B1', point: 'normal', seg: [19.65, 25.4],
      stem: 'What does Jerry say he would like to do?',
      choices: ['Just have everyone go back to work', 'Just have a normal lunch with everyone',
                'Just have everything go back to normal'], a: 2,
      cue: '「Honestly」で始まる文の後半。', line: 'Honestly, what I would like to do is just *have everything go back to normal*.',
      said: '「何でもしよう」に、「正直、全部いつもどおりに戻ってほしい」と答える。',
      mean: 'go back to normal ＝ 普段の状態に戻る。特別扱いは要らない。',
      trap: 'go back だけだと「仕事に戻る」に聞こえやすい。to のあとまで続けて聞く。',
      use: 'Things are finally back to normal.（やっと元どおりになった）' },

    // R fix: V1 + V2 (blind 60 %): "relief at skipping the fuss" leaned on knowing the speaker (Ron hates fuss); now the
    //   key is what the words do, taking Jerry at his word, whoever says them. V5: C1 → B2 (two adjacent lines)
    // why: talk him into it ← the "Jerry Day… anything at all" offer heard as still on; rest first ← a boss checking on
    //      someone just back, read as concern
    { id: 'i2', skill: 'infer', level: 'B2', point: 'worktime', reveals: ['normal'], seg: [19.65, 31.5],
      stem: 'After Jerry’s wish, what does the reply show?',
      choices: ['He tries to talk Jerry into the party anyway', 'He agrees, but asks Jerry to rest a bit first',
                'He takes Jerry at his word and moves to work'], a: 2,
      cue: '「sounds good」のすぐあとに出る話題。',
      line: 'just have everything go back to normal. — *That sounds good to me.* Okay. *I believe you were going to do a presentation.*',
      said: '「いつもどおりがいい」に「いいね」と即答し、そのまま「発表をする予定だったね」と続ける。',
      mean: '希望を言葉どおりに受け取り、すぐ仕事に戻している。',
      trap: '「何でもしよう」のあとなので、説得や気づかいが続くと思いやすい。直後の一言で読む。',
      use: 'Sounds good to me. Let’s get started.（いいね。始めよう）' },

    // R fix: V2 (blind 55 %): choices now share one frame ("Telling…"), and the key is no longer the only warning-shaped
    //   one
    // why: help set up ← "support" read as hands-on help (サポート); behind him ← heard as said to Jerry, though "you guys"
    //      is the team and Jerry has just left
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'nojokes', reveals: ['support'], seg: [31.8, 37.7],
      stem: 'Once Jerry goes off to set up, what is the next line for?',
      choices: ['Telling the team to help Jerry set up', 'Telling Jerry that the team is behind him',
                'Telling the team not to tease Jerry'], a: 2,
      cue: '「Remember, you guys」のあとに並ぶ3つ。',
      line: 'Remember, you guys, *no jokes, no comments*, nothing but support.',
      said: 'Jerry が準備に行くと、「いい？冗談もコメントもなし、応援だけ」と皆に言う。',
      mean: '先に釘を刺している。からかう人が出ると分かっているから。',
      trap: 'support を「手伝い」と取りやすい。no jokes と並ぶので、からかうなの意味。',
      use: 'Remember, no phones at dinner.（いい？夕食中はスマホなしね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'support', reveals: ['nojokes'], seg: [33.05, 37.7],
      stem: 'Type the end: “no jokes, no comments, ___.” (3 words)', answer: 'nothing but support',
      cue: '「no comments」のあと、最後の3語。', line: 'no jokes, no comments, *nothing but support*.',
      said: '「冗談もコメントもなし、応援だけ」と皆に言う。',
      mean: 'nothing but ＝ 〜だけ。ほかのものは一切なし、という強い言い方。',
      trap: 'nothing の g と but の t はほぼ消え、「ナッスィンバッ」とつながる。but を落とさない。',
      use: 'Nothing but good news today.（今日はいい知らせばかり）' },

    // R fix: V2 (blind 50 %): "our job to run it" was weak; now Jerry's own later line ("winding down", 85 s) is the
    //   near miss; its trap names "winding down", so reveals 'winding'
    // why: nearly over ← his later "season is winding down" (85 s) carried back; hard on us ← "upon" heard as a weight
    //      on everyone
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'upon', reveals: ['winding'], seg: [46.5, 51.5],
      stem: 'As Jerry opens his talk, what does he say about spring hunting season?',
      choices: ['It is nearly over now', 'It has already arrived', 'It has been hard on us'], a: 1,
      cue: '「season is」のあと、短い2語。', line: 'So, as we know, spring hunting season *is upon us*.',
      said: '発表の始めに「春の狩猟シーズンがやってきました」と言う。',
      mean: 'be upon us ＝ もう来ている。季節や行事に使う改まった言い方。',
      trap: 'upon を「のしかかる」と取りやすい。季節＋upon us は「到来」。winding down と混ぜない。',
      use: 'The holidays are upon us.（もう休暇シーズンだ）' },

    // R fix: V2 (blind 60 %): "drops it for his trip" was weak (he says "Anyway" and goes on); now "one big mix-up", the
    //   near miss on how many things go wrong
    // why: going well ← the computer starts after "Just got to power up", read as a fresh start; one big mix-up ← the
    //      vacation photo heard as the whole problem
    { id: 'g2', skill: 'gist', level: 'B2', point: 'mishaps', reveals: ['anyway', 'marbles'], seg: [46.5, 102.6],
      stem: 'How does Jerry’s presentation go, overall?',
      choices: ['It goes fine once the computer is on', 'Small slips keep throwing it off track',
                'One big mix-up spoils it from the start'], a: 1,
      cue: '機械、画面、言葉、眼鏡と、何が起きるか。',
      said: '電源が入っていない、グラフの代わりに旅行の写真、言いそこない、眼鏡がない、と続く。',
      mean: '小さなトラブルが重なって、発表がなかなか進まない場面。',
      trap: '旅行の写真が目立つが、そのあとも言いそこないや眼鏡が続く。一つでなく全体の流れで判断。',
      use: 'It’s just one thing after another today.（今日はトラブル続きだ）' },

    // why: closures ← "season" and later "closed season" heard as parks closing; where to hunt ← "spring hunting" heard as
    //      a trip plan
    { id: 'd2', skill: 'detail', level: 'B1', point: 'license', seg: [51.3, 56.7],
      stem: 'What information is Jerry’s presentation meant to give?',
      choices: ['Which parks will close when the season ends', 'How the new hunting license system works',
                'Where to go hunting and fishing this spring'], a: 1,
      cue: '「anyway」のあと、info about に続く語。', line: 'anyway, here’s the info about *the new licensing system*.',
      said: '「では、新しい許可証の仕組みの資料です」と本題に入る。',
      mean: 'licensing system ＝ 狩猟などの許可証を出す仕組み。発表のテーマ。',
      trap: 'season や hunting から行き先や閉園の話と思いやすい。info about のあとが中身。',
      use: 'Here’s the info about the new schedule.（新しい予定の資料です）' },

    // why: can't see ← "I don't think" taken as real doubt (かもしれない); mocking ← the hedge on the obvious heard as a
    //      dry joke, like the team's earlier jabs
    // anchor: 57.8–60.4 s "Jerry? I don't — I don't think your computer is plugged in": a restart before a plain fact; Jerry
    //         answers at once "I'm sorry, guys. Just got to power up" (no doubt, no laugh)
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'plugged', seg: [57.3, 63.45],
      stem: 'Why does the speaker begin with “I don’t think” about Jerry’s computer?',
      choices: ['Because the plug is out of the speaker’s view', 'To make a plain fact easier for Jerry to hear',
                'To tease Jerry by acting unsure of the obvious'], a: 1,
      cue: '「Jerry?」のあとの言い直しと、Jerry の返事。',
      line: 'Jerry? *I don’t — I don’t think* your computer is plugged in. — I’m sorry, guys.',
      said: '名前を呼び、言い直しながら「電源が入ってないと思う」と言う。Jerry はすぐ謝る。',
      mean: '明らかな事実に I don’t think を付けて、指摘を柔らかくしている。言い直しも言いにくさの表れ。',
      trap: '「〜と思う」を本当の自信のなさと取りやすい。分かりきった事を控えめに言うのは気づかい。',
      use: 'I don’t think that’s quite right.（それ、ちょっと違うかも）' },

    // anchor: 62.36–62.80 s three words in under half a second, with no subject before them; both sources: "Just got to"
    { id: 'c1', skill: 'dict', level: 'C2', point: 'powerup', seg: [60.95, 63.45],
      stem: 'Type what Jerry says: “I’m sorry, guys. ___ power up.” (3 words)', answer: 'just got to',
      cue: '「sorry, guys」のすぐあと。文法より、聞こえた音を。',
      line: 'I’m sorry, guys. *Just got to* power up.',
      said: '「ごめん、起動しないと」と言う。主語はなく、3語が「ジャスガラ」と一続き。',
      mean: '(I’ve) got to ＝ 〜しなきゃ。会話では主語と have がよく落ち、got to は gotta に近い。',
      trap: '文法どおりに I や have を足したくなる。正しい文でなく、言われた音だけを書く。',
      use: 'Sorry, got to run.（ごめん、もう行かなきゃ）' },

    // R fix: V2 (blind 60 %): "envious" was weak; now a sincerity flip (impressed by the choice). V5: B2 → C1 (the
    //   tease is never said; only "you chose" and Jerry's defence carry it), which also lifts C1 from 17 % to 22 %
    // why: never heard of it ← adding "Indiana" sounds like a request to place the town; impressed ← "you chose" heard
    //      as praise for picking somewhere new
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'muncie', seg: [69.3, 83.4],
      stem: 'How does the question about Jerry’s vacation spot come across?',
      choices: ['Curious: he has never heard of the town before', 'Impressed: he likes that Jerry tried a new place',
                'Teasing: he thinks it’s a silly place to pick'], a: 2,
      cue: '質問の後半と、Jerry の言い返し。',
      line: 'You went on a vacation and *you chose* Muncie, Indiana? … — Tom, Muncie is *a lovely city*.',
      said: '「休暇でそこを選んだの？」と聞かれ、Jerry は「いい町だよ」と言い返す。',
      mean: 'and you chose ～? は「なんでそこ？」というからかい。',
      trap: '州名まで言うので場所の確認に聞こえやすい。言われた側が町をかばうなら、けなされている。',
      use: 'Day off, and you chose to work?（休みなのに仕事？）' },

    // why: wife grew up there ← "My wife" heard, the rest missed; hotel deal ← "time share" heard as a deal on a room
    { id: 'd3', skill: 'detail', level: 'B1', point: 'timeshare', seg: [69.3, 79.8],
      stem: 'What reason does Jerry give for his choice of vacation spot?',
      choices: ['His wife grew up there and loves it', 'He and his wife own a timeshare there',
                'They got a good deal on a hotel there'], a: 1,
      cue: '「Yeah」のあと、my wife and I に続く語。', line: 'Yeah. *My wife and I have a timeshare.*',
      said: 'なぜそこへと聞かれ、「妻と別荘の共有権を持っている」と答える。',
      mean: 'timeshare ＝ リゾートの部屋を年に何週間か使える権利。だから毎年行く。',
      trap: 'my wife だけを拾うと「妻の故郷」と考えやすい。have a のあとの名詞が理由。',
      use: 'We have a timeshare in Hawaii.（ハワイに別荘の利用権がある）' },

    // R fix: V2 (blind 65 %): the key was the only choice not about the town; now all three are
    // why: concedes ← "Anyway" heard as "whatever, you're right"; one more thing ← heard as "and also" about the town
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', reveals: ['muncie'], seg: [79.45, 86.05],
      stem: 'Right after defending the town, what does Jerry’s first word do?',
      choices: ['It grants Tom’s point about the town', 'It adds one more point about the town',
                'It leaves the town topic for his talk'], a: 2,
      cue: '「lovely city」のあと、文頭の一語。',
      line: 'Tom, Muncie is a lovely city. *Anyway*, hunting and fishing season…',
      said: '町をかばったあと、「とにかく、狩猟と釣りのシーズンは…」と発表に戻る。',
      mean: 'anyway ＝ 脱線を切り上げて本題に戻る合図。相手の言い分を認める意味はない。',
      trap: '「まあいいや」と折れたように聞こえやすい。anyway のあとに続く話題で働きを見る。',
      use: 'Anyway, where were we?（で、どこまで話したっけ）' },

    // why: getting going ← the opening "spring hunting season is upon us" carried over; shut down ← "down" and the next
    //      "closed season" heard as a sudden close
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'winding', seg: [83.2, 89.2],
      stem: 'What does Jerry say is happening with hunting and fishing season?',
      choices: ['It’s coming to an end', 'It’s just getting going', 'It has been shut down early'], a: 0,
      cue: '「season is」のあと、-ing の語と down。',
      line: 'Anyway, hunting and fishing season is *winding down*, okay?',
      said: '「とにかく、狩猟と釣りのシーズンは終わりに近づいている」と言う。',
      mean: 'wind down ＝ だんだん終わりに向かう。急に止まるのではない。',
      trap: 'down から「閉鎖」を想像しやすい。wind down は徐々に、shut down は一気に。',
      use: 'The party was winding down by midnight.（夜中にはパーティーもお開きムードだった）' },

    // R fix: V2 (blind 65 %): "something in his mouth" was weak; now the near miss "makes up a saying" (scrambled vs
    //   invented), which only knowing the saying settles
    // why: made up ← the scrambled saying heard as a new one, invented on the spot; glasses ← the next line ("Has
    //      anybody seen my glasses?") heard as the excuse
    { id: 'h1', skill: 'humor', level: 'C1', point: 'marbles', seg: [90.7, 98.05],
      stem: 'Why does Jerry’s line about his marbles get a laugh?',
      choices: ['He makes up a saying to excuse his slip', 'He blames his glasses for misreading a slide',
                'He mixes up a saying while explaining a slip'], a: 2,
      cue: '説明のあと、today で終わる文。',
      line: 'I said twout instead of trout. … *My marbles are full of mouth* today.',
      said: '「twout と言っちゃった」と説明し、慣用句の語順を逆にしてしまう。',
      mean: '本来は My mouth is full of marbles（口が回らない）。その説明で、また言いそこなう。',
      trap: '新しい句に聞こえやすいが、元の句の語が入れかわっただけ。',
      use: 'Sorry, I’m tripping over my words today.（ごめん、今日は舌が回らない）' },

    // R fix: V2 (blind 50 %): "Has nobody" was the odd one out; "Has somebody" is as natural as the key
    // why: Hasn't ← n't's t drops, and a complaint fits a lost item; Has somebody ← "-body" heard, the weak "any" taken
    //      as "some"; Have any of you ← "any" heard, the rest guessed
    { id: 's1', skill: 'sound', level: 'B2', point: 'anybody', seg: [97.7, 102.6],
      stem: 'Fill the gap: “You know what? ___ seen my glasses?”',
      choices: ['Has anybody', 'Hasn’t anybody', 'Has somebody', 'Have any of you'], a: 0,
      cue: '「You know what?」のあと、短く弱い出だし。', line: 'You know what? *Has anybody* seen my glasses?',
      said: '発表の途中で「そうだ、誰か僕の眼鏡を見なかった？」と聞く。',
      mean: 'Has anybody が「ハゼニバディ」とつながる。has は弱く、ほぼ「ハz」。',
      trap: 'Hasn’t なら「誰も見てないの？」と不満になる。n’t の t が消えても「ン」は残る。',
      use: 'Has anybody seen my keys?（誰か私の鍵見なかった？）' },
  ]
};
