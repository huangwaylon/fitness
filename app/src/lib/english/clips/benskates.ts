// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 1
// “Ben's most niche fantasy comes true | Parks and recreation” (the official Parks and Recreation channel, Season 6):
// on the night of Ben's roller-skating birthday party, Councilman Jamm springs a vote to strip Eagleton of its votes;
// Leslie, still in her skates, starts a filibuster, and Jamm tries everything to make her stop.
// Segments from the captions, words from whisper (2026-11-16). The captions drop 81–82 s (“was tabled”), 125–128 s
// (“I remember the first time I voted”), 237–243 s (the cake line) and 247–251 s; no key rests on those words. The
// sources differ at 17 s (“sesh” / “session”) and 106.5 s (an unclear line); no item uses them. No item uses Ben's
// “sex fantasy” line (119–124 s), Jamm's “Chinese crap” list (185–192 s), the 1817 quote (261–274 s), the joke on
// Milton's age (143–147 s) or the Reagan line (198–204 s, world knowledge).
// EAR CHECK: 214.1 s a3 — Jamm's “Oops” is taken as mock regret; the key rests on his “I turned up the heat to 90”,
//   the ear confirms the tone
import type { Clip } from '../types.ts';

export const benSkates: Clip = {
  id: 'benskates', video: 'P9vdDJIlz_U', title: 'Ben\'s most niche fantasy comes true', dur: 300, wpm: 171,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: her seat ← "career on the line" heard as her job being at stake; vote against ← "their votes" heard as
    //   Eagleton turning on her
    { id: 'd1', skill: 'detail', level: 'B1', point: 'votes', seg: [0, 5.6],
      stem: 'What does Leslie say Jamm is trying to do?',
      choices: ['Take Eagleton’s votes away from her', 'Take her seat on the city council away',
                'Get Eagleton to vote against her'], a: 0,
      cue: '「he is trying to」のあとの動詞。',
      line: 'he is trying to *rob me of their votes*',
      said: '「職を賭けてイーグルトンを救ったのに、彼はその票を奪おうとしてる」と怒る。',
      mean: 'rob A of B ＝ A から B を奪う。',
      trap: 'career on the line から「職を失う」話と取りやすい。rob me of のあとを聞く。',
      use: 'The noise robbed me of my sleep.（騒音で眠れなかった）' },

    // dict: "let's focus on" — "let's" loses its t, "focus on" links (フォーカソン)
    { id: 'x1', skill: 'dict', level: 'B1', point: 'focus', seg: [13.2, 15.62],
      stem: 'Type it: “But ___ the more important issue.” (3 words)', answer: "let's focus on",
      cue: '「horrible monster. But」のすぐあと。',
      line: 'But *let’s focus on* the more important issue.',
      said: '「でも、もっと大事な話に集中しよう」と言う。',
      mean: 'focus on ＝ …に集中する。話題を切りかえる決まった言い方。',
      trap: 'let’s の t が弱く、focus on が「フォーカソン」とつながる。',
      use: 'Let’s focus on the good part.（いい方に目を向けよう）' },

    // R fix: V2 (blind 50 %) + S4 (2.4 s) + S1 ("before the party" isn't said here); the key and the "cut one" miss
    //   now share only the tight time, and "full speed" (squeeze = press hard) replaces "a lot harder"
    // why: cut one ← "squeeze" heard as squeezing out; full speed ← squeeze read as pressing hard
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'squeeze', seg: [14.6, 18.0],
      stem: 'What is suggested about their practice sessions?',
      choices: ['Adding one more, though time is tight', 'Dropping one, since time is tight',
                'Doing the last one at full speed'], a: 0,
      cue: '「want to」のあとの動詞と in。',
      line: 'You want to *squeeze in* one more practice sesh?',
      said: '「もう一回、練習をねじこむ？」と聞く。sesh は session の略。',
      mean: 'squeeze in ＝ 忙しい中に何とか入れる。時間がないところに一回足す。',
      trap: 'squeeze（しぼる）から「減らす」と取りやすい。in が付くと「詰めこむ」。',
      use: 'Can you squeeze me in today?（今日、何とか入れてもらえますか）' },

    // why: "Do I need to?" ← the inverted form heard as a real question; polite no ← the Japanese frame: a short
    //   question back as a soft refusal
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'doi', reveals: ['squeeze'], seg: [15.2, 19.6],
      stem: 'What does the short reply to the practice question mean?',
      choices: ['An eager “yes, of course”', 'A real question: “Do I need to?”', 'A gentle way of saying no'], a: 0,
      cue: '答えの語順と、Oh の勢い。',
      line: 'You want to squeeze in one more practice sesh? — *Oh, do I.*',
      said: '「もう一回練習する？」に「するに決まってる」と返す。',
      mean: 'Oh, do I. は質問でなく「もちろん」。語順を逆にして気持ちの強さを出す言い方。',
      trap: 'do I を疑問と取ると「必要？」に聞こえる。文末が上がらないのは、強い肯定。',
      use: 'Do you want pizza? — Oh, do I.（ピザ食べる？ー食べるに決まってる）' },

    // R fix: V2 (blind 70 %), the key was the only one that sounded like a joke; all three are now "They treat … like
    //   a disaster", with "the wrong band" (Monster heard as another band) replacing "never heard of the band"
    // why: wrong band ← "Monster" heard as a different band from REM; old music ← "early 90s" heard as "too old"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'rem', seg: [48.3, 61.8],
      stem: 'Why do they get so worked up about the DJ’s albums?',
      choices: ['They treat a few years’ gap like a disaster', 'They treat the DJ’s wrong band like a disaster',
                'They treat the DJ’s old music like a disaster'], a: 0,
      cue: '「what is this, a …」のあとの年代。',
      line: 'He’s got Monster, but not Automatic for the People. … what is this, a *mid-90s* party? — No, it’s an *early 90s* party.',
      said: 'DJ に欲しいアルバムがない。「これじゃ90年代半ばのパーティーだ」と嘆く。',
      mean: '数年のずれを大事件のように騒ぐのが笑い。テーマへのこだわりの強さが見える。',
      trap: 'バンド名を知らなくても解ける。mid と early の対比が、何が問題かを教えている。',
      use: 'This is a dinner party, not a barbecue!（これは夕食会で、バーベキューじゃないの！）' },

    // why: (dict) the learner drops "it's like" as filler, or writes "is it like"
    // anchor: 57.90–58.62 s "it's like what is this", five weak words in under a second, both sources; "it's like"
    //   introduces a quoted reaction, which grammar would leave out
    { id: 'c2', skill: 'dict', level: 'C2', point: 'rem', seg: [56.9, 59.65],
      stem: 'Type it: “I know. ___, a mid-90s party?” (5 words)', answer: "it's like what is this",
      cue: '「I know」のすぐあと。文法より、聞こえた音を。',
      line: 'I know. *It’s like what is this*, a mid-90s party?',
      said: '「だよね。なんていうか、何これ、90年代半ばのパーティー？」と言う。5語が一息で速い。',
      mean: 'it’s like は、心の声を引用する前置き。文法には要らないが、会話では反応を伝える大事な合図。',
      trap: 'it’s like を飾りとして消したくなる。書き取りは、意味より聞こえた語を順に書く。',
      use: 'It’s like, who does that?（なんていうか、誰がそんなことする？）' },

    // R fix: V2 (blind 50 %), "a vote next week" didn't carry the table frame its why: claimed; "only up for
    //   discussion" now does
    // why: passed ← "untabled" heard as done and dusted; up for discussion ← the Japanese frame: テーブルに載せる =
    //   to put up for discussion
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'tabled', seg: [79.5, 85.6],
      stem: 'Why is Leslie surprised to see this bill tonight?',
      choices: ['She thought it had been set aside for now', 'She thought it had already been passed',
                'She thought it was only up for discussion'], a: 0,
      cue: '「special session」のあとの un で始まる動詞。',
      line: 'I thought this bill was *tabled*. — Yes, and I called a special session and *untabled* it.',
      said: '「この法案は棚上げのはずでしょ」に「特別会議を開いて、棚上げを解いた」と返される。',
      mean: 'table（米）＝ 議題を先送りにする。un が付いて、その先送りを取り消した。',
      trap: '「テーブルに載せる」は話し合う意味に取りやすいが、米語では逆の「棚上げ」。',
      use: 'Let’s table this until Monday.（この件は月曜まで保留にしよう）' },

    // R fix: V2 (blind 70 %), "sorry" was a filler; "curious" (his own "What is up with the roller skates?" taken as
    //   real interest) replaces it
    // why: likes skating too ← "blades" heard as sharing her hobby; curious ← his opening question heard as wanting
    //   to know
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'blades', seg: [85.4, 93.2],
      stem: 'How does Jamm react to Leslie’s reason for the skates?',
      choices: ['Dismissive: he waves her reason off', 'Friendly: he likes skating too',
                'Curious: he asks to hear more about it'], a: 0,
      cue: '「Yeah」のあとの短い一文。',
      line: '…a roller-skating birthday party for my husband… — Yeah, *I don’t care*. I’m a blades guy.',
      said: '夫の誕生日パーティーの話に、「どうでもいい。俺はインライン派」と返す。',
      mean: 'I don’t care で話を切り捨てている。相手の事情に関心がない。',
      trap: 'blades からスケート好き同士に聞こえやすい。先の I don’t care が態度。',
      use: 'Honestly, I don’t care either way.（正直、どっちでもいい）' },

    // R fix: V2 (blind 55 %), "keep it short" was off-pattern; "give up her seat" (yield = surrender, the object
    //   lost) makes three "Give up/in" choices
    // why: give in ← yield = 屈する; seat ← yield = 明け渡す, "her time" lost
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'yield', seg: [96.6, 102.45],
      stem: 'What does Jamm ask Leslie to do so they can vote?',
      choices: ['Give up her turn to speak', 'Give in and vote his way', 'Give up her seat on the council'], a: 0,
      cue: '「councilwoman」のあとの動詞と her time。',
      line: 'Will the councilwoman *yield her time* so we can vote on this sucker?',
      said: '「議員は発言時間を譲ってくれますか。そうすれば採決できる」と言う。',
      mean: 'yield one’s time ＝ 発言の番を譲る。議会の決まった言い方。',
      trap: 'yield を「屈する」と取りやすいが、目的語が time なら「譲る」。',
      use: 'I’ll yield to my colleague.（同僚に発言を譲ります）' },

    // R fix: V2 (blind 75 %) + S3 (the cue's "vote" was a key-only word); "until supporters arrive" (the later
    //   Eagleton visit, the wrong aim) replaces "party guests"
    // why: win them over ← a long speech heard as persuasion; supporters ← the citizens who come later heard as
    //   what she's waiting for
    { id: 'g1', skill: 'gist', level: 'B2', point: 'filibuster', reveals: ['eleven'], seg: [96.6, 158.4],
      stem: 'Why does Leslie plan to keep talking all evening?',
      choices: ['To block the vote until the session ends', 'To win the council over with a long speech',
                'To delay the vote until supporters arrive'], a: 0,
      cue: 'Ben が説明する、会議のルール。',
      said: '夜じゅう譲らないと言い、Ben が「11時まで話し続けなきゃいけない」と説明する。',
      mean: '話し続ける限り採決できない。議事妨害（filibuster）で時間切れをねらっている。',
      trap: '長い演説は説得に聞こえやすいが、目的は時間をつぶすこと。',
      use: 'We just need to run out the clock.（あとは時間切れを待てばいい）' },

    // R fix: V2/§9.5 (blind 60 %): "No/Now will I yield" aren't grammatical, so only Nor fitted; the gap now takes
    //   the three words, all real options
    // why: Nor would I ← the weak "will" heard as "would"; Now I will ← the n- start and "I" heard, the order lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'nor', seg: [101.2, 106.2],
      stem: 'Fill the gap: “___ yield for the rest of the evening.”',
      choices: ['Nor will I', 'Nor would I', 'Now I will'], a: 0,
      cue: '二つ目の文の最初の一語、母音の長さ。',
      line: 'I will not yield. *Nor* will I yield for the rest of the evening.',
      said: '「譲りません。今夜のあいだ、ずっと譲りません」と言う。',
      mean: 'Nor will I … ＝ …もしない。否定を重ねるとき、主語と助動詞が逆になる。',
      trap: '直前の No と似て聞こえる。would なら d が残る。will I の語順を聞く。',
      use: 'I can’t swim. Nor can my brother.（泳げない。弟もだ）' },

    // R fix: V2 (blind 60 %), "more popular" was a filler; "still upset that her pig lost" ("What are you gonna do?"
    //   heard as bitterness) replaces it
    // why: never voted ← "the first time I voted" taken as a confession; still upset ← the closing shrug heard as a
    //   grudge
    { id: 'h3', skill: 'humor', level: 'C1', point: 'pig', seg: [125.2, 138.4],
      stem: 'What makes Leslie’s story about her first vote funny?',
      choices: ['A toy vote is told like a real election', 'She admits she has never voted for real',
                'She is still upset that her pig lost'], a: 0,
      cue: '「won」のあとの短い理由と、そのあとの一言。',
      line: 'I voted for Mildred, my stuffed pig. But my cat, Pancakes, won. *She had more funding.*',
      said: '5歳のとき、ぬいぐるみのブタに投票したが、猫が勝った。「資金が多かったから」と話す。',
      mean: '子どもの遊びを、本物の選挙のように語っている。',
      trap: '最後の一言を恨みと取りやすいが、肩をすくめる決まり文句。funding（資金）が大人の選挙の言葉。',
      use: 'Long story short, the cat won.（要するに、猫が勝ったの）' },

    // why: the pig ← Mildred lost, so the story sounds like it mocks her; the cat ← "had more funding" heard as the
    //   cat cheating
    // anchor: 134.6–138.1 s "She had more funding. Politics, right? What are you gonna do?": "Politics, right?" turns the
    //   toy vote into a remark on real elections
    { id: 'c1', skill: 'humor', level: 'C2', point: 'pig', seg: [125.2, 138.4],
      stem: 'In Leslie’s story about her first vote, who is the joke on?',
      choices: ['Real politics, where money wins', 'Mildred, for losing to a cat', 'Pancakes, the cat, for buying the vote'],
      a: 0,
      cue: '「funding」のあと、話を広げる一言。',
      line: 'She had more funding. *Politics, right? What are you gonna do?*',
      said: '猫が勝った理由を「資金が多かった」と言い、「政治ってそういうもの」と付け足す。',
      mean: 'おもちゃの選挙を通して、お金で決まる本物の選挙を皮肉っている。Politics, right? で的が広がる。',
      trap: '話の中の負けた側や勝った側を的と取りやすい。最後のまとめの一言が、何を笑うかを決める。',
      use: 'Traffic, right? What can you do?（渋滞ってね。仕方ないよ）' },

    // R fix: V2 (blind 55 %): "actually" pointed at the small number; it's gone, and "Eighty minutes" adds the
    //   -teen/-ty trap
    // why: three hours ← her own guess is the last number before the answer; eighteen/eighty ← eight heard with an
    //   ending that isn't there
    { id: 'n3', skill: 'number', level: 'B1', point: 'eight', seg: [138.4, 141.5], keep: true,
      stem: 'How long has Leslie been talking?',
      choices: ['Eight minutes', 'Eighteen minutes', 'Eighty minutes', 'Three hours'], a: 0,
      cue: '「No」のすぐあとの数字。',
      line: 'How long have I been talking? Three hours? — No, *eight minutes*.',
      said: '「どのくらい話してる？3時間？」に「いや、8分」と返される。',
      mean: '本人の感覚と実際の差が大きい。この先がまだ長いと分かる。',
      trap: '自分で言った three hours が耳に残る。eighteen は「ティーン」、eighty は「ティ」が付く。',
      use: 'It’s only been ten minutes.（まだ10分しかたってないよ）' },

    // why: 7 p.m. ← eleven/seven, the same "-even" ending; 10 p.m. ← a common closing time
    // R fix: S4, the segment was 2.2 s
    { id: 'n2', skill: 'number', level: 'B1', point: 'eleven', seg: [148.1, 151.2], keep: true,
      stem: 'When does the session end?',
      choices: ['7 p.m.', '10 p.m.', '11 p.m.'], a: 2,
      cue: '「ends at」のすぐあと。',
      line: 'The session *ends at 11 p.m.*',
      said: '「会議は夜11時に終わる」と説明する。',
      mean: '11時まで話し続ければ、採決はできないまま会議が終わる。',
      trap: 'eleven と seven は後ろが同じ。最初の「イ」の音があるかを聞く。',
      use: 'The shop closes at eleven.（店は11時に閉まる）' },

    // R fix: V2 (blind 70 %), "forgot his birthday" was a filler; "agrees this room is best" (the question's
    //   enthusiasm taken as his) replaces it
    // why: anywhere without Leslie ← "where else… with Leslie" heard as Ben wanting to get away from her; agrees ←
    //   "the most exciting thing" heard as his answer too
    { id: 'h4', skill: 'humor', level: 'C1', point: 'rather', seg: [158.2, 169.3],
      stem: 'Why is Ben’s answer to “Where else…?” funny?',
      choices: ['The obvious place is the party they’re missing', 'He’d rather be anywhere but with Leslie',
                'He agrees this room is the best place to be'], a: 0,
      cue: '「Well, maybe」のあとの、パーティーの話。',
      line: 'Where else on earth would you rather spend your birthday with Leslie? — Well, maybe *the birthday party she’s throwing for me right now*.',
      said: '「誕生日を過ごすなら、ここ以上の所がある？」に「今やってるはずのパーティーかな」と返す。',
      mean: '答えは分かりきっている。熱く語る相手に、当たり前の事実を静かに返すのが笑い。',
      trap: 'with Leslie を外して聞くと、彼女と離れたいように聞こえる。',
      use: 'Where else would I rather be? Home.（ほかに行きたい所？家だね）' },

    // R fix: V2/K6 (blind 65 %), "Obviously" was the only sure word and the doubt choice wasn't the same content;
    //   now "of course" against "I guess" on the same answer, which is the point under test
    // why: I guess ← "maybe" taken as real doubt (かもしれない); anywhere but here ← the reply heard as a
    //   complaint about Leslie, not the place
    // anchor: 162.7–169.1 s "Where else on earth would you rather spend your birthday" → "Well, maybe the birthday
    //   party she's throwing for me right now": the party is his own, planned by her, and happening now
    { id: 'c3', skill: 'infer', level: 'C2', point: 'rather', seg: [161.6, 169.3],
      stem: 'Which plain-English version keeps what Ben means?',
      choices: ['“The party she planned for me, of course.”', '“The party she planned for me, I guess.”',
                '“Anywhere at all, as long as it isn’t here.”'], a: 0,
      cue: '「maybe」と、そのあとの答えの当たり前さ。',
      line: 'Well, *maybe* the birthday party she’s throwing for me *right now*.',
      said: '「ここより良い所は？」に「うーん、今まさに彼女が開いてくれてるパーティーかな」と返す。',
      mean: 'maybe は控えめに見せる飾り。答えが当たり前すぎるので、「決まってるだろ」という意味になる。',
      trap: 'maybe を自信のなさと取りやすい。控えめな語に、当たり前の答えが続いたら遊び。',
      use: 'Maybe… my own bed?（そうだな…自分のベッドかな？）' },

    // why: stopped talking ← "talk the whole time" was the first rule; leaned ← "can't lean on anything" was another
    { id: 'i4', skill: 'infer', level: 'B2', point: 'strike', seg: [172.6, 181.3],
      stem: 'Why does Leslie get her first strike?',
      choices: ['She sat down to take her skates off', 'She stopped talking for a second or two',
                'She leaned on a desk to take a rest'], a: 0,
      cue: '「Strike one」のあとの二語。',
      line: 'I’m just going to *take these off* for a second. — Strike one. *No sitting.*',
      said: '「ちょっとこれ脱ぐね」と言ったところで、「ストライク1。座るのは禁止」と言われる。',
      mean: 'スケート靴を脱ごうとして座ったのがルール違反。three strikes の一つ目。',
      trap: 'ルールはいくつもある。どれを破ったかは、No のあとの語で決まる。',
      use: 'No phones at the table.（食事中、携帯は禁止）' },

    // R fix: V2 (blind 85 %), "meant to turn it down" was a filler; "blames the old heater" (the knob line heard as
    //   an excuse) makes two "Not at all" choices
    // why: an accident ← "oops" and "the knob broke" taken at face value; blames the heater ← "the knob broke off"
    //   heard as pinning it on the equipment
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'heat', seg: [204.2, 214.8],
      stem: 'How sorry is Jamm when he says the knob broke?',
      choices: ['Not at all: he made it hot on purpose', 'Very: it really was an accident',
                'Not at all: he blames the old heater'], a: 0,
      cue: '「Maybe that’s because」のあとの、自分がしたこと。',
      line: 'Maybe that’s because *I turned up the heat to 90*, and, uh, oh, the knob broke off in my hand. *Oops.*',
      said: '「暖房を90度にしたからかな。あ、つまみが取れた。おっと」と言う。',
      mean: '自分で温度を上げたと言っている。oops は形だけで、わざと弱らせている。',
      trap: 'oops は「うっかり」の言葉なので事故と取りやすい。その前に言った turned up を聞く。',
      use: 'Oops. Did I do that?（おっと。僕がやった？）' },

    // R fix: V2 (blind 70 %), the key was the only clever move; "complain about the heat" (her own earlier "hot in
    //   here") replaces "admits the heat is getting to her", in the key's shape
    // why: asks him ← "speaking of" heard as asking about the heat; complains ← "heat" plus her earlier "Does anyone
    //   else think it's hot in here?"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'speaking', seg: [208.2, 221.0],
      stem: 'After Jamm’s remark about the heat, how does Leslie carry on?',
      choices: ['She uses his word to move to her own topic', 'She asks him to explain what he did',
                'She uses his word to complain about the heat'], a: 0,
      cue: '「Well」のあと、heat をくり返す二語。',
      line: '*Well, speaking of heat*, we should discuss America’s *white-hot passion* for voting rights',
      said: '「暑さと言えば、投票権への熱い情熱について話しましょう」と続ける。',
      mean: 'speaking of … ＝ …と言えば。相手の言葉を借りて、自分の話へつなげている。',
      trap: 'heat が出るので文句に聞こえやすい。speaking of は話題をつなぐ合図。',
      use: 'Speaking of food, are you hungry?（食べ物と言えば、お腹すいてる？）' },

    // R fix: V2 (blind 55 %), "a guest who made Ben's cake" was a filler; "another councilwoman stuck in the session"
    //   (third person taken literally) replaces it
    // why: an Eagleton councilwoman ← "former Eagleton" and voting rights are the topic; another councilwoman ← the
    //   third person heard as someone else in the room
    { id: 'i5', skill: 'infer', level: 'C1', point: 'cake', seg: [220.6, 230.1],
      stem: 'Who is the councilwoman Leslie ends up praising?',
      choices: ['Leslie herself, who is now very hungry', 'A councilwoman from Eagleton',
                'Another councilwoman stuck in the session'], a: 0,
      cue: '「her husband’s」のあとと、その人の今の様子。',
      line: 'like the *local city councilwoman* who is *starving* and thinking about *her husband’s* … *birthday cake*',
      said: '投票権を守る人たちの例に、「おなかがすいて、夫の誕生日ケーキのことを考えている市議」を挙げる。',
      mean: '市議で、夫の誕生日の人は彼女自身。演説が自分の空腹の話にずれている。',
      trap: '三人称なので他人に聞こえやすい。夫の誕生日ケーキの話は、自分の今夜の話。',
      use: 'A certain someone ate my cake.（誰かさんが私のケーキを食べた）' },

    // R fix: V2 (blind 70 %) + S3 (the cue's "fading" was a key-only word); "Ben gets her a snack" (the smuggling
    //   plan, only proposed, then cut off) replaces "Jamm drops the bill"
    // why: gives up ← "she's fading" heard as the end; a snack ← "smuggle … onto her tongue" heard as done
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['eagleton'], seg: [229.9, 260.5],
      stem: 'How is the filibuster going near the end of the clip?',
      choices: ['She starts to fade, then supporters lift her', 'She gives up and lets the vote go ahead',
                'She starts to fade, then Ben gets her a snack'], a: 0,
      cue: '後半に入ってくる人たちの一言。',
      said: '「彼女、弱ってきた」と言われたところへ、イーグルトンの住民が応援に来る。',
      mean: '限界が近い中で、応援が力になる。まだ終わっていない場面。',
      trap: 'fading から「あきらめた」と取りやすい。smuggle の話は計画だけで、すぐ別の人たちが入ってくる。',
      use: 'I was fading, but your call helped.（へばってたけど、電話で元気が出た）' },

    // R fix: V2 (blind 55 %), "vote themselves tonight" was a filler; "ask her to save their votes" (preserving
    //   heard as a request, not thanks) replaces it
    // why: protest ← a crowd arriving at a council fight heard as opponents; ask to save ← "for preserving" heard as
    //   what they want, not what she did
    { id: 'd6', skill: 'detail', level: 'B1', point: 'eagleton', seg: [250.9, 257.5],
      stem: 'Why have the people from Eagleton come?',
      choices: ['To back Leslie for saving their votes', 'To protest against Leslie’s long speech',
                'To ask Leslie to save their votes'], a: 0,
      cue: '「We’re here to」のあと。',
      line: 'We’re here to *support Leslie Knope* for *preserving our voting rights*.',
      said: '「投票権を守ってくれたレスリーを応援しに来た」と言う。',
      mean: 'preserve ＝ 守る、保つ。レスリーの側に立つために来た。',
      trap: 'voting rights から「守ってと頼みに来た」と取りやすい。for -ing はしてくれたことへのお礼。',
      use: 'We’re here to support our team.（チームの応援に来ました）' },
  ]
};
