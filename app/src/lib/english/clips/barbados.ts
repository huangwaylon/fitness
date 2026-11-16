// REVIEW 2026-11-16: pass 5, fix 14, drop 0, new 0; ear checks 1
// REVIEW open: the blind pass for this clip was contaminated (the header, which sums up the scene, was read before the
//   stems): g2, d2 and i1 were fixed and d3 kept on a cautious estimate; a fresh cold read would settle them.
// “Joey and Ross Get Ready for Barbados | Friends” (the official Friends channel, Best of Season 9): Ross, flying out
// today for the conference where he gives a speech, surprises the friends with passes to every lecture; they'll hear
// his speech but want the rest of the trip for the island, and one says David will want lectures only to stay out of
// the sun.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈74.5 s (music after; whisper loops
// "All right, let's do it" from 79 s, and the captions park "invisibility" at 84.4 s). Untested: 13.8–20.4 s (the
// captions have "Barbados" twice and "got to say", whisper one "Barbados" and "I was about to say"; no name says who
// answers the baby), 29.7 s (captions "everything one passes", whisper "everyone passes"; no key uses the word), and
// 69.4–74.5 s (the blanket lines are innuendo; n2 stops at "drinks").
// EAR CHECK: 61.6–62.3 s nt2 — both sources have "we better go" with no "'d"; confirm no "we'd" is heard before the
//   C2 dictation keys on "we better"
import type { Clip } from '../types.ts';

export const barbados: Clip = {
  id: 'barbados', video: 'GCsy4Ko5IiY', title: 'Joey and Ross Get Ready for Barbados', dur: 86, wpm: 185,
  band: 'fast', tags: ['旅行', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 90 %, though the header was read first): the science-course filler gave way to a Joey-speaks
    //   swap, refuted by "to hear *me* give my speech"
    // why: beach holiday ← "all packed", "island stuff" and an eager Joey build a vacation story; Joey's talk ←
    //   "Daddy and Uncle Joey are going on a trip" puts Joey at the centre, and "conference" is said in the same breath
    { id: 'g2', skill: 'gist', level: 'B1', point: 'trip', seg: [5.3, 50.65],
      stem: 'What is taking the group to Barbados?',
      choices: ['A conference where Ross is giving a speech', 'A beach holiday that Joey has been planning',
                'A conference where Joey is giving a talk'], a: 0,
      cue: '行き先の前の名詞と、みんなが何を聞きに行くか。',
      line: 'We’re going to a *conference* in Barbados… to hear me *give my speech*.',
      said: '「バルバドスの学会に行く」「スピーチを聞きに来てくれる」と話す。',
      mean: '旅の目的は Ross の学会での発表。仲間はそれを聞きに行く。',
      trap: 'island stuff や lectures が耳に残ると、休暇や講座に引かれる。目的は最初の説明で決まる。',
      use: 'I’m giving a talk at a conference.（学会で発表するんだ）' },

    // R fix: V2 + K6 (blind 70 %): the key was the only warm choice; "surprised they bothered" became "nervous about
    //   the speech", which "means so much to me" refutes
    // why: nervous ← "to hear me give my speech" ends the line, so stage fright seems the point; sorry ← "all the way
    //   over there" heard through the Japanese わざわざすみません frame (gratitude said as an apology)
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'means', seg: [18.5, 25.45],
      stem: 'How does Ross feel about his friends making the trip?',
      choices: ['Touched that they’d come all this way for him', 'Nervous that they’ll be there to watch his speech',
                'Sorry that they have to come so far for him'], a: 0,
      cue: 'it means のあと。距離の言い方も手がかり。',
      line: 'it *means so much to me* that you guys are coming *all the way over there*',
      said: '「わざわざあそこまで来てくれて、本当にうれしい」と言う。',
      mean: 'means so much ＝ とてもうれしい。all the way は「わざわざ」。',
      trap: 'all the way を「遠くまで悪いね」と取りやすい。means so much は感謝。',
      use: 'Thanks for coming all the way out here.（遠いところをありがとう）' },

    // R fix: V2 (blind 65 %): the key was the only choice about people; all three are now ways of getting a favour
    // why: paid ← a costly-gift script, since passes for everyone sound expensive; extra talk ← "had to" heard as a
    //   deal he made with the organizers
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'strings', reveals: ['passes'], seg: [25.45, 35.0],
      stem: 'How does Ross say he managed his surprise?',
      choices: ['By calling in favors from people he knows', 'By paying for them out of his own pocket',
                'By offering to give a second talk for free'], a: 0,
      cue: 'surprise のあと、had to に続く決まった言い方。',
      line: 'I had to *pull some strings*, but I was able to get everyone passes',
      said: '「ちょっとコネを使って、全員分のパスを取った」と言う。',
      mean: 'pull strings ＝ 知り合いの力で、ふつうは無理なことを通す。',
      trap: 'had to で「条件を飲んだ」と取りやすいが、strings は人のつながり。お金の話は出てこない。',
      use: 'Maybe my uncle can pull some strings.（おじさんに口をきいてもらえるかも）' },

    // R fix: V2 (blind 70 %): "passes" now sits in two choices, so the key turns on "entire", not on the noun
    // why: his talk only ← "my speech" is said just before, and "passes" is heard; flight seats ← travel talk plus
    //   "get everyone"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'passes', seg: [25.45, 35.0],
      stem: 'What did Ross manage to get for the friends?',
      choices: ['Passes to the entire conference', 'Passes to his own talk only', 'Seats on the same flight as him'], a: 0,
      cue: 'but I was able のあと、get everyone に続く部分。',
      line: 'I was able to get everyone *passes to the entire conference*.',
      said: '「全員分、学会全体のパスを取れた」と言う。',
      mean: 'entire ＝ 全部の。スピーチだけでなく、講演もセミナーも全部入れるパス。',
      trap: '直前に speech が出るので「スピーチの席」に引かれやすい。the entire のあとの名詞まで聞く。',
      use: 'I got us passes for the whole weekend.（週末ずっと使えるパスを取ったよ）' },

    // R fix: V2 (blind 60 %): "Teasing, knowing they'll hate it" was a filler; "Modest" reads "had to pull some strings,
    //   but…" as playing the effort down, and "That's right. These babies…" refutes it
    // why: unsure ← "I had to pull some strings, but…" heard as a worry; modest ← the same "but" heard as a shrug
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'surprise', seg: [25.45, 40.4],
      stem: 'How does Ross feel as he gives out his surprise?',
      choices: ['Proud, sure the gift will thrill them', 'Unsure, afraid they won’t want it',
                'Modest, playing down what it took'], a: 0,
      cue: 'That’s right の言い方と、そのあとの売り込み。',
      line: 'Oh, and I have *a surprise*… *That’s right.* These babies will get you into *all* the paleontology lectures',
      said: '「サプライズがあるんだ」と切り出し、「そうさ。これで講演も全部入れる」と続ける。',
      mean: '最高の贈り物だと思い、得意になっている。',
      trap: 'but や babies の軽さで、謙遜や冗談に聞こえやすい。That’s right は本気の得意顔。',
      use: 'I have a surprise for you!（サプライズがあるの！）' },

    // R fix: V2 (blind 80 %): "he just got everyone" in the key echoed the line before; the choices are now parallel
    // why: children ← babies taken literally (a baby was talked to at the start); his talks ← "my baby" for a project
    //   you made, and "lectures" follows
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'babies', reveals: ['passes'], seg: [25.45, 40.4],
      stem: 'When Ross starts a line with “These babies…”, what is he referring to?',
      choices: ['The passes he got for everyone', 'The children coming on the trip', 'The talks he will give there'], a: 0,
      cue: 'これより前に Ross が全員分そろえた物。',
      line: 'get everyone passes… That’s right. *These babies* will get you into…',
      said: '全員分のパスの話のすぐあとに「こいつで講演に全部入れる」と言う。',
      mean: 'these babies ＝ 自慢の物を指す「こいつら」。車や道具にも使う。',
      trap: 'babies を赤ちゃんと取ると話が通らない。自慢げな these babies は直前の物を指す。',
      use: 'Check out these babies. New shoes!（見てよこれ、新しい靴！）' },

    // R fix: V2 + §9.6 (blind 70 %): the key was the only middle path; "go to all of it, though they'd rather not" is
    //   the sitcom ending, refuted by "the rest of the time… island stuff"
    // why: skip even his talk ← "get us out of them" heard as covering the speech too; go to it all ← "Yeah, Ross…
    //   excited" heard as polite acceptance (the Japanese 遠慮 frame)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['island', 'passes'], seg: [25.45, 60.3],
      stem: 'How do the friends take Ross’s surprise?',
      choices: ['They’ll hear his talk but want the rest free', 'They’ll skip even his talk to enjoy the island',
                'They’ll go to it all, though they’d rather not'], a: 0,
      cue: 'パスの話への返事を、最後まで聞いて。',
      said: 'Ross は講演も全部入れるパスを配るが、仲間は「スピーチは聞く。でもあとは島で遊ぶ」と返す。',
      mean: '自慢の贈り物と、仲間の休暇気分のずれが中心。',
      trap: '抜け出す冗談だけ聞くと、スピーチにも行かないように聞こえる。スピーチは楽しみ、と言っている。',
      use: 'Count me in for dinner, not drinks.（夕食は行く、飲みはパス）' },

    // R fix: V2 + N7 (blind 50 %): the strings distractor gave away f1's key, and the stem names the passes (d2); now a
    //   literal reading of "get into" (= get hooked on), and reveals passes
    // why: hooked on ← "get into" also means "start to like", and a Japanese ear may take the reply as playing on that;
    //   babies ← the last odd word Ross used, heard as what the reply plays on
    { id: 'h1', skill: 'humor', level: 'C1', point: 'getout', reveals: ['island', 'passes'], seg: [34.95, 45.4],
      stem: 'What makes the first reply to Ross’s passes a joke?',
      choices: ['It asks for a way out of what Ross just offered', 'It hears “get you into” as “get you hooked on”',
                'It plays on the word “babies” Ross just used'], a: 0,
      cue: 'Ross の売り込みと、返事の後半を並べて。',
      line: 'These babies will *get you into*… — Do you have anything that will *get us out of* them?',
      said: '「これで全部入れる」に「全部から抜け出せる物は？」と返す。',
      mean: 'into を out of に返し、「講演は行きたくない」と冗談で伝えた。',
      trap: '目立つ語（babies など）に笑いを探しやすい。相手の言葉を逆にした返しを聞く。',
      use: 'Any way to get out of it?（なんとか抜けられない？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getout', seg: [40.45, 45.4],
      stem: 'Type the question: “Do you have anything that will ___ them?” (4 words)', answer: 'get us out of',
      cue: 'will のあと、them の前。4語がつながる。',
      line: 'Do you have anything that will *get us out of* them?',
      said: '「それから抜け出させてくれる物はある？」と聞く。',
      mean: 'get us out of は「ゲラサウロヴ」に近い。t が弾み、語がつながる。',
      trap: 'us と of は弱く、消えたように聞こえる。get ＋人＋out of の形で覚える。',
      use: 'Can you get me out of this meeting?（この会議から抜けさせてくれない？）' },

    // R fix: V2 + K6 (blind 75 %): the key was the only kind-but-no; all three are now hedged, and "lectures" replaces
    //   "talks" (Ross's speech is a talk they will hear)
    // why: grudging yes ← "Yeah" read as a yes (the Japanese はい frame) and "excited" as polite; joking along ← the
    //   first reply was a joke, so "I mean" sounds like more of it
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'island', seg: [45.35, 50.65],
      stem: 'When the next friend starts with “Yeah, Ross, I mean…”, what is the reply doing?',
      choices: ['Turning down the lectures, but kindly', 'Accepting the lectures, if a bit grudgingly',
                'Joking along, but planning to go'], a: 0,
      cue: 'speech のすぐあとの一語から、最後の stuff まで。',
      line: 'we’re *excited to hear the speech*, *but* the rest of the time… *island stuff*.',
      said: '「スピーチは楽しみ。でもそれ以外の時間は、島っぽいことがしたい」と言う。',
      mean: 'まずほめてから but で本音。講演には行かない、を角を立てずに伝えている。',
      trap: 'Yeah を「はい」と取ると賛成に聞こえる。ここは話の入り口で、本音は but のあと。',
      use: 'I’d love to, but I already have plans.（行きたいけど、もう予定があって）' },

    // why: have to ← "wanna" and "hafta" share the weak ending; want to ← "going to" shrinks to a quick "gonna" and is
    //   lost; going to ← "want to" fades into "do"
    { id: 's1', skill: 'sound', level: 'C1', point: 'gonna', reveals: ['island'], seg: [45.35, 50.65],
      stem: 'Fill the gap: “…the rest of the time ___ do, you know, island stuff.”',
      choices: ['we’re going to want to', 'we’re going to have to', 'we want to', 'we’re going to'], a: 0,
      cue: 'the rest of the time のあと、短い音が続く所。',
      line: 'the rest of the time *we’re going to want to* do, you know, island stuff',
      said: '「残りの時間は島らしいことがしたくなるはず」と言う。',
      mean: 'going to want to は「ゴナワナ」と縮む。先の気持ちを言う形。',
      trap: 'wanna と hafta は語尾が似ている。縮んだ音の頭の w と h を聞く。',
      use: 'You’re going to want a jacket.（上着が要ると思うよ）' },

    // why: give ← "give my speech" earlier, so hear/give swap; only the speech ← "excited to hear the speech" just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'david', seg: [45.35, 53.0],
      stem: 'What does a friend say David will probably want to do?',
      choices: ['Hear a few of the lectures', 'Give a few of the lectures', 'Hear only Ross’s speech'], a: 0,
      cue: 'David の名前のあと、want to に続く動詞。',
      line: 'I think *David* will probably want to *hear a few lectures*.',
      said: '「David はたぶん講演をいくつか聞きたがると思う」と言う。',
      mean: '仲間の中で一人だけ、講演に行きそうな人がいる、という話。',
      trap: '前に give my speech があるので give に引かれやすい。want to のあとの動詞を聞く。',
      use: 'I think I’ll probably skip the party.（たぶんパーティーはパスするかな）' },

    // R fix: V2 (blind 80 %, header read first): the key was the only odd, specific reason; "away from crowds" is a
    //   near miss (indoors, wrong reason)
    // why: scientist ← said in the clip, then turned down by "No, no"; crowds ← "been in Minsk for eight years" heard
    //   as someone who isn't used to busy places, and lectures are quiet
    { id: 'i1', skill: 'infer', level: 'B2', point: 'sunlight', reveals: ['david'], seg: [50.6, 60.3],
      stem: 'Why will David want lectures, from what his friend explains?',
      choices: ['They’ll keep him out of the sun', 'They’ll keep him away from crowds',
                'He’s a scientist and loves the topic'], a: 0,
      cue: '「No, no」のあと、because に続く理由。',
      line: '*No, no*… if he gets too much *direct sunlight*, he’ll die.',
      said: '「ちがうの、日光を浴びすぎると死んじゃうから」と言う。',
      mean: '講演は室内なので、日に当たらずに済む。科学が好きだからではない、という話。',
      trap: 'scientist が先に出るので、それが理由だと思いやすい。No, no のあとに本当の理由が来る。',
      use: 'Let’s stay inside, out of the sun.（中にいよう、日に当たらないように）' },

    // C2: the scope of "No, no" (cf. i1)
    // anchor: 50.7–52.9 s the same friend has just said David "will probably want to hear a few lectures"; 54.8–59.5 s
    //   "No, no, well, because…" restarts the "because" with a new reason (sunlight) and never says what David is instead
    // why: not a scientist ← "No, no" lands right after "he's a scientist", so it sounds like a denial of the fact;
    //   won't want lectures ← "No" heard as dropping the plan itself
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'sunlight', reveals: ['david'], seg: [50.6, 60.3],
      stem: 'In the talk about David, what does the friend’s “No, no” reject?',
      choices: ['The reason given for David wanting lectures', 'The idea that David is a scientist at all',
                'The plan that David will go to the lectures'], a: 0,
      cue: 'No, no のすぐあと、because で何が言い直されるか。',
      line: 'Oh, right, *because* he’s a scientist. — *No, no*, well, *because*, you know…',
      said: '「科学者だからね」に「ちがうちがう、だって…」と別の理由を出す。講演の話はそのまま。',
      mean: 'No は because の部分だけを打ち消す。because を言い直し、理由だけ入れ替えている。',
      trap: 'No を聞くと事実や予定ごと否定したと取りやすい。No のあとに何を言い直すかで範囲が決まる。',
      use: 'No, not because it’s cheap. Because it’s close.（安いからじゃなくて、近いから）' },

    // R fix: V2 + V3 (blind 50 %): the key restated i1's fact (sun kills him); it now names the mechanism, and both
    //   distractors are jokes a listener could hear in it
    // why: bookish ← "scientist" + "lectures" + Minsk read as a dig at a dull academic, but "No, no" drops that reason;
    //   skip the trip ← lectures read as his excuse not to come, though he is coming and stays indoors
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sunlight', reveals: ['david'], seg: [50.6, 60.3],
      stem: 'What makes the friend’s reason for David funny?',
      choices: ['It turns a little sun into a death threat', 'It mocks David as a dull, bookish scientist',
                'It hints David would rather skip the trip'], a: 0,
      cue: '日光について言う、最後の二語。',
      line: 'if he gets too much *direct sunlight*, *he’ll die*.',
      said: '「日光を浴びすぎたら死んじゃう」と言う。',
      mean: '講演に行く理由が「科学好き」ではなく「日に当たると死ぬ」。大げさすぎる理由が笑い。',
      trap: 'scientist から堅物いじりと取りやすいが、No, no でその理由は消える。笑いは he’ll die。',
      use: 'If I don’t eat soon, I’ll die.（早く食べないと死にそう）' },

    // R fix: V2 (blind 50 %): two of three choices said "eight years"; four choices cross eight/eighteen with
    //   months/years, ascending
    // why: months ← "years" is weak mid-sentence, and eight months sounds like a normal stay; eighteen ← eight and
    //   eighteen differ only in the -teen ending
    { id: 'n1', skill: 'number', level: 'B1', point: 'eight', seg: [53.0, 60.3], keep: true,
      stem: 'How long has David been in Minsk?',
      choices: ['Eight months', 'Eighteen months', 'Eight years', 'Eighteen years'], a: 2,
      cue: 'Minsk のすぐあと、for に続く部分。',
      line: 'he’s been in Minsk *for eight years*',
      said: '「ミンスクに8年いた」と言う。',
      mean: 'for ＋期間で「〜の間ずっと」。has been と合わせて、今まで続いている。',
      trap: 'eighteen なら -teen が長く強く聞こえる。years は文の途中で弱くなるが、s まで聞く。',
      use: 'I’ve lived here for eight years.（ここに住んで8年です）' },

    // C2: exact words in fast speech (the dropped "'d")
    // anchor: 61.64–62.24 s both sources have "okay we better go" (no "'d"), run together at 185 wpm before "yeah?"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'better', seg: [61.1, 63.3],
      stem: 'Type what’s said: “Okay, ___ go, yeah?” (2 words)', answer: 'we better',
      cue: 'Okay のすぐあと。文法より、聞こえた音を。',
      line: 'Okay, *we better* go, yeah?',
      said: '「よし、もう行かなきゃ、だよね？」。we と better がひと続きで、間に音はない。',
      mean: '文法では we’d better だが、会話では d が落ちて we better が多い。',
      trap: '習った形に合わせて we’d と書きたくなる。書き取りは、聞こえた音を書く。',
      use: 'We better hurry, or we’ll miss it.（急がないと間に合わないよ）' },

    // why: together tomorrow ← "tomorrow" attached to the flight; back tomorrow ← "see you tomorrow" heard as the two
    //   coming back
    // R fix: S4: the segment ended on the first sound of "get" (69.4 s) and held a line it doesn't need; it now ends
    //   after "let's do it", before "Five-hour" (66.7 s)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'tomorrow', seg: [61.1, 66.65],
      stem: 'From the goodbye at the end, what is the travel plan?',
      choices: ['The others will join them a day later', 'They will all fly out together tomorrow',
                'The two will fly back home tomorrow'], a: 0,
      cue: 'see you guys のあとの一語と、出発の言葉。',
      line: '…so we’ll see you guys *tomorrow*. — All right, *let’s do it*.',
      said: '「じゃあ、また明日」と言い、もう一人が「よし、行こう」と出発する。',
      mean: '先に二人が出て、ほかの仲間は明日来る。明日、向こうで会うということ。',
      trap: 'tomorrow を飛行機の日と取ると全員一緒に聞こえる。今出る二人の言葉なので、明日来るのは残る側。',
      use: 'Go ahead. I’ll meet you there tomorrow.（先に行って。明日向こうで会おう）' },

    // why: nine ← five and nine share the "ai" vowel, so only the first consonant differs; fifteen ← "five" heard with
    //   a -teen
    // R fix: S4: the end moved from 69.4 s (the start of "get under that blanket") to 69.1 s, just after "drinks"
    { id: 'n2', skill: 'number', level: 'B1', point: 'flight', seg: [65.25, 69.1], keep: true,
      stem: 'How long is the flight they’re about to take?',
      choices: ['Five hours', 'Nine hours', 'Fifteen hours'], a: 0,
      cue: 'let’s do it のすぐあと、flight の前。',
      line: '*Five-hour flight* with Charlie…',
      said: '「チャーリーと5時間のフライト」と言う。',
      mean: '数字＋hour が名詞の前に来ると hours にしない。',
      trap: 'five と nine は母音が同じ。最初の f と n で聞き分ける。fifteen なら -teen が長い。',
      use: 'It’s a three-hour drive from here.（ここから車で3時間です）' },
  ]
};
