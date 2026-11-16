// “Joey Skips Work on Thanksgiving | Friends” (the official Friends channel, Best of Season 9): Joey asks his friends
// for a good lie to explain why he missed a work thing; a friend says he stinks at lying, Phoebe tests him with her
// missing muffin, his raccoon story collapses, and the friends agree to help him practice a lie.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈61.2 s. Untested: 4.1 s ("Thieves!" in
// whisper, "peeps" in the captions), 38.2 s ("came around in the air" in whisper, "came running in" in the captions),
// 56.9–61.2 s (the "Pick up Grandma at the airport?" ending: whose line and what it means aren't clear from the words).
// EAR CHECK: 48.7 s nt1 — "What am I gonna do?" is taken as Joey's own plea after the story (whisper punctuates it
//   inside the raccoon's quote; the captions have no punctuation; the reply "Don't worry…" at 50.3 s supports the key)
// REVIEW 2026-11-16: pass 6, fix 13, drop 1, new 1; ear checks 1
// OPEN: nt1 — the key rests on reading "What am I gonna do?" as Joey's own line (see the ear check)
// OPEN: i2 — the blind read is still ~45 % for anyone who knows the sitcom "who ate it?" script
import type { Clip } from '../types.ts';

export const joeyLie: Clip = {
  id: 'joeylie', video: 'sIIIN3eykJ4', title: 'Joey Skips Work on Thanksgiving', dur: 72, wpm: 155, band: 'mid',
  tags: ['友だち', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 % and right): "space show" swapped for an excuse-shaped near miss
    // why: too wild ← the moon line heard as an excuse offered to Joey, not a claim about the landing; bad at lies ←
    //   the next friend's line ("you stink at lying") bleeds into this one
    { id: 'hu1', skill: 'humor', level: 'C1', point: 'moon', seg: [9.8, 18.5],
      stem: 'Why does the first answer to Joey’s request get a laugh?',
      choices: ['It offers a famous hoax, not an excuse he can use', 'It suggests an excuse too wild for anyone to buy',
                'It makes fun of him for being so bad at lies'], a: 0,
      cue: '最初の返事の話題と、Joey が欲しいものの差。',
      line: 'How about the whole “*man walking on the moon*” thing? … You can see the strings, people!',
      said: '「月面着陸の件はどう？糸が見えてるって！」と答える。',
      mean: '有名な「でっちあげ説」を出し、言い訳ではなく「世の中の大うそ」の話にすり替えている。そのずれが笑い。',
      trap: '直後に別の人が嘘の下手さを言うので混ざりやすい。最初の返事は月の話だけ。',
      use: 'Come on, everyone knows that’s fake.（みんな作り物だって知ってるよ）' },

    // R fix: V2 (blind 60 % and right; the hoax reading is world knowledge): two "faked" choices now split on
    //   "you can see", so the key needs the second half of the line
    // why: hard to prove ← "faked" caught but "you can see" lost; proof it happened ← "see" taken as "you can see
    //   the evidence" for a real landing
    { id: 'i1', skill: 'infer', level: 'B2', point: 'moon', seg: [9.8, 18.5],
      stem: 'What does the friend claim about the moon landing?',
      choices: ['It was faked, and anyone can see it', 'It was faked, but it’s hard to prove',
                'It was real, and the proof is easy to see'], a: 0,
      cue: '「see」のあと、何が見えると言うか。',
      line: 'You can see *the strings*, people!',
      said: '月面着陸を例に出し、「糸が見えるだろ、みんな」と言う。',
      mean: '糸＝撮影でつるす仕掛け。それが見えるなら作り物、つまり着陸はでっちあげだという冗談の主張。',
      trap: 'faked だけで止めず、see のあとまで聞く。糸が「見える」なら、証拠は目の前にある。',
      use: 'You can totally tell it’s fake.（作り物なのがバレバレ）' },

    // R fix: K1 ("asks Joey whether he gets the idea" was defensible for "you know?") → a turn-handing distractor
    //   the next line refutes; S4: the segment now runs on to "…people!", the evidence that he keeps talking
    // why: know the story ← "you know?" read word by word as a real question; hands the turn ← it comes right after
    //   Joey's request and a pause, so it sounds like a cue for Joey to answer
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', seg: [9.8, 18.3],
      stem: 'Right after the moon idea, what does the two-word add-on do?',
      choices: ['Asks the others to go along with it', 'Asks whether the others know the story',
                'Hands the turn to Joey for a reply'], a: 0,
      cue: '「moon thing」のあと、上がり調子の2語。',
      line: 'the whole “man walking on the moon” thing? *You know?*',
      said: '「月面着陸の件とか、ね？」と付け足してから、糸が見えると続ける。',
      mean: 'You know? は知っているかの質問ではなく「分かるでしょ、ね？」と同意を求める付け足し。',
      trap: '「知ってる？」と文字通り取りやすい。返事を待たずに話が続いたら、確認の付け足し。',
      use: 'It’s a little expensive, you know?（ちょっと高いよね）' },

    // R fix: V2 (blind 60 % and right): new distractors that are things friends might offer here
    // why: cover for him ← the usual sitcom script (friends phone in for him); apology ← "practice" is said, and help
    //   from friends sounds like honest advice
    { id: 'g1', skill: 'gist', level: 'B1', point: 'help', reveals: ['comeup'], seg: [14.6, 56.85],
      stem: 'By the end, what do Joey’s friends offer to do?',
      choices: ['Help him make up a lie and rehearse it', 'Call his work and cover for him themselves',
                'Help him rehearse an apology to his boss'], a: 0,
      cue: '「Don’t worry」のあと、何を手伝うか。',
      line: 'We’ll come up with a good lie. I’ll *help you practice it*.',
      said: '「心配しないで、一緒に考えて練習も手伝う」と言う。',
      mean: 'practice it の it は嘘のこと。正直に話す練習ではなく、作り話の練習。',
      trap: '謝る練習とも取れそうだが、it が指すのは直前の good lie。代名詞の中身を前から拾う。',
      use: 'Don’t worry, I’ll help you practice.（大丈夫、練習を手伝うよ）' },

    // why: Thanksgiving ← said at the start ("Happy Thanksgiving"); tomorrow ← "work" + an excuse heard as a future
    //   sick day, with the t of "wasn't" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'workthing', seg: [14.6, 24.35],
      stem: 'What does Joey need a lie to explain?',
      choices: ['Why he wasn’t at a work event today', 'Why he was late for Thanksgiving today',
                'Why he can’t go to work tomorrow'], a: 0,
      cue: '「to explain」のあと、why 以下。',
      line: 'I need a good lie to explain *why I wasn’t at a work thing today*.',
      said: '「今日の仕事の用事に行かなかった理由を説明する嘘が要る」と言う。',
      mean: 'work thing ＝ 仕事がらみの用事。もう休んだあとの言い訳。',
      trap: '冒頭の Thanksgiving が残りやすい。wasn’t と today で、過去の話と分かる。',
      use: 'I need an excuse for missing the meeting.（会議を休んだ言い訳が要る）' },

    // why: really happened ← "no" heard as an answer to "you can see the strings" (arguing about the moon); too big a
    //   lie ← "no" read as rejecting this lie as unbelievable, not as the wrong kind
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'nonono', reveals: ['workthing'], seg: [14.6, 24.35],
      stem: 'When Joey answers the moon idea with “No, no, no…”, what is he doing?',
      choices: ['Making clear what kind of lie he needs', 'Saying the moon landing really happened',
                'Saying the idea is too big a lie to use'], a: 0,
      cue: 'No の連続のあと、何を言い直すか。',
      line: 'No, no, no, *I need a good lie to explain*…',
      said: '「違う違う、仕事を休んだ言い訳の嘘が要るんだ」と言い直す。',
      mean: '月の話への反論ではなく「そういう意味じゃない」。頼みを言い直して誤解を正す。',
      trap: '直前の主張への反対と取りやすい。No のあとで頼みを言い直したら、誤解を正す合図。',
      use: 'No, no, I mean a table for two.（いえ、2人用の席という意味です）' },

    // R fix: V2 (blind 60 % and right): "Ooh, honey" left the stem (its pity cued "bad at"); "feels awful" became a
    //   literal "stink" (nasty) reading
    // why: too often ← "stink" heard as a general complaint about him lying a lot; mean ones ← "stink" (くさい, 嫌な)
    //   read literally as nasty lies
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'stink', seg: [22.36, 25.45],
      stem: 'Once Joey says what the lie is for, what does a friend say about him?',
      choices: ['He’s no good at telling lies', 'He tells lies far too often', 'His lies tend to be mean ones'], a: 0,
      cue: 'stink のすぐあとに at が来ている点。',
      line: 'Ooh, honey, you *stink at* lying.',
      said: '「ああ、嘘がほんとに下手だよね」と言う。',
      mean: 'stink at ～ ＝ ～がひどく下手。くだけた言い方で、stink（くさい）から来ている。',
      trap: '「嘘ばかりつく」と回数の話に取りやすい。be good at の反対で、at のあとが苦手なこと。',
      use: 'I stink at remembering names.（名前を覚えるのが本当に苦手）' },

    // R fix: V2 (blind 50 % and right): the distractors now share the key's feeling, so "I do not" decides it
    // why: admits it ← he later asks for help, so it sounds like he gives in here; asks for help ← keyword trap from
    //   the end of the scene
    { id: 'at1', skill: 'attitude', level: 'B1', point: 'donot', reveals: ['stink'], seg: [22.36, 27.35],
      stem: 'How does Joey take the comment about his lying?',
      choices: ['He’s a bit hurt, and denies it', 'He’s a bit hurt, but admits it',
                'He shrugs, and asks for help'], a: 0,
      cue: 'honey のあと、Joey の短い返事。',
      line: 'you stink at lying. — Well, *I do not*.',
      said: '「嘘が下手」と言われて、「下手じゃないよ」と短く言い返す。',
      mean: 'I do not は I don’t より強い否定の形。ちょっとむっとして言い返している。',
      trap: 'あとで助けを頼むので、ここでも素直に認めたと思いやすい。この時点ではまだ否定している。',
      use: 'Hey, I am not that bad!（ちょっと、そこまでひどくないよ）' },

    // R fix: V2 (blind 65 % and right): "doubtful" now in two choices, so "let me ask you something" decides it
    // why: let it go ← doubt heard but the follow-up missed; asking him to explain ← "really?" heard as plain
    //   surprise (本当？), and she does go on to ask him something
    { id: 'at2', skill: 'attitude', level: 'C1', point: 'really', reveals: ['test', 'donot'], seg: [22.36, 27.35],
      stem: 'When Joey denies it, how does Phoebe’s “Oh, really?” sound?',
      choices: ['Doubtful, and about to test him', 'Doubtful, but willing to let it go',
                'Surprised, and asking him to explain'], a: 0,
      cue: '「Oh, really?」のすぐあとに続く言葉。',
      line: 'Well, I do not. — *Oh, really?* Okay, let me ask you something.',
      said: '否定するジョーイに「へえ、そう？じゃあ聞くけど」と返す。',
      mean: '驚きではなく「本当に？試そうか」という疑い。試す質問がすぐ続く。',
      trap: '「本当？」を素直な驚きと取りやすい。Okay, let me… が続いたら反証の前ぶれ。',
      use: 'Oh, really? Prove it.（へえ、じゃあ証明して）' },

    // R fix: V2 (blind 55 % and right) and N7: the stem named the muffin (d2's key); new topic-change distractor
    // why: who took it ← her question "Who took it?" taken at face value; her own problem ← a new story out of
    //   nowhere sounds like a change of subject
    { id: 'g2', skill: 'gist', level: 'B2', point: 'test', reveals: ['really', 'donot'], seg: [22.36, 50.25],
      stem: 'Why does Phoebe bring up something from yesterday?',
      choices: ['To see whether he can really lie', 'To find out who really took it',
                'To change the subject to her day'], a: 0,
      cue: '「I do not」の直後、彼女が何を始めるか。',
      line: 'Well, I do not. — Oh, really? Okay, *let me ask you something*.',
      said: '嘘が下手と言われて否定したジョーイに、マフィンの件を尋ねる。',
      mean: '犯人さがしではなく、嘘の腕前を試すテスト。答え方で下手かどうかが分かる。',
      trap: '「誰が取った？」を文字通り取りやすい。直前のやり取りから、質問の目的を考える。',
      use: 'Oh, really? Let me ask you something.（へえ、そう？じゃあ聞くけど）' },

    // R fix: V2 (blind 50 % and right): "muffin" and "gone" now each in two choices
    // why: coffee ← "coffee house" is said twice, with "gone" caught; half eaten ← "muffin" caught but not "gone"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'gone', seg: [27.2, 34.3],
      stem: 'In Phoebe’s question, what happened while she was in the bathroom?',
      choices: ['Her muffin was gone', 'Her coffee was gone', 'Her muffin was half eaten'], a: 0,
      cue: '「when I came back」のあと。',
      line: 'when I came back, *my muffin was gone*. Who took it?',
      said: '「トイレから戻ったら、マフィンがなくなってた。誰が取った？」',
      mean: 'gone ＝ なくなっている。戻ったときにはもう無かった。',
      trap: 'coffee house が聞こえるので、コーヒーの話に引っぱられやすい。came back のあとが答え。',
      use: 'When I came back, my bag was gone.（戻ったらかばんがなかった）' },

    // R fix: V2 (blind 60 % and right): "in particular" cued a suspect; parallel "She thinks…" choices; C5: reveals gone
    // why: saw it ← his answer sounds like an eyewitness account; track it down ← "Who took it?" heard as a request
    //   for help, not a test
    { id: 'i2', skill: 'infer', level: 'C1', point: 'culprit', reveals: ['test', 'door', 'gone', 'straight'], seg: [27.2, 39.95],
      stem: 'What does Phoebe’s question suggest she believes?',
      choices: ['She thinks he’s the one who took it', 'She thinks he was there and saw it',
                'She thinks he’ll help track it down'], a: 0,
      cue: '質問が「嘘のテスト」になるには、何が必要か。',
      line: 'Who took it? — Somebody opened the door… and *a raccoon*… went straight for your muffin.',
      said: '「誰が取った？」に、ジョーイはアライグマが飛びこんだ話を作る。',
      mean: '嘘を試すなら、相手が隠したいことを聞く。作り話が出るのも、彼が食べた印。',
      trap: '目撃者として聞いたと取りやすい。見ただけなら、作り話は要らない。',
      use: 'Okay, who ate my yogurt?（で、私のヨーグルト食べたの誰？）' },

    // R drop: nt2 (C2, culprit): same fact as i2, blind 65 % and right, and "left the door open" is refutable only
    //   by treating the whole story as a lie (K2). Never shipped, so deleted; replaced by nt3 below.

    // R fix: S3 cue leak (the cue named "opened", a word only the key had)
    // why: Phoebe left it open ← "bathroom" from her question heard as the door in his story; window ← the usual
    //   animal-gets-in script
    { id: 'd3', skill: 'detail', level: 'B1', point: 'door', seg: [33.7, 39.95],
      stem: 'In Joey’s story, how did the raccoon get into the coffee house?',
      choices: ['Somebody opened the door', 'Phoebe left a door open', 'It came in through a window'], a: 0,
      cue: '話の出だし、ドアの前の部分。',
      line: '*Somebody opened the door* to the coffee house, and a raccoon…',
      said: '「誰かがドアを開けて、アライグマが入ってきた」と話す。',
      mean: 'Somebody ＝ 誰か。誰のせいでもない形の出だし。',
      trap: 'さっきの bathroom が残ると、トイレのドアに聞こえやすい。opened の前の主語を聞く。',
      use: 'Somebody left the door open.（誰かがドアを開けっぱなしにした）' },

    // R new: nt3 replaces nt2 (C2: exact weak words in fast speech)
    // anchor: 39.0–39.7 s "went straight for your muffin" (both sources): "for" shrinks to a weak "fer" before
    //   "your", unlike "to" (a "tə") or "right" (no st cluster)
    // why: straight to ← "for" reduced to a schwa heard as the weak "to", the commoner verb pattern; right for ←
    //   "straight" clipped in fast speech, leaving only the final t
    // retired: a C2 sound item, until its ear check (the weak “for” before “your muffin”, 33.7–39.95 s)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'straight', reveals: ['gone'], seg: [33.7, 39.95], retired: true,
      stem: 'Fill the gap: “…and a raccoon ___ your muffin.”',
      choices: ['went straight for', 'went straight to', 'went right for'], a: 0,
      cue: 'muffin の直前、弱く短くなる前置詞。',
      line: 'a raccoon… *went straight for* your muffin.',
      said: 'ジョーイの作り話。「アライグマが一直線に君のマフィンに向かった」。',
      mean: 'go straight for ～ ＝ ～めがけて一直線。for は弱く「ファ」程度で your とつながる。',
      trap: '弱い for は to と同じくらい短い。go to の型に引かれやすいが、狙う相手には for。',
      use: 'The kids went straight for the cake.（子どもたちは一直線にケーキへ）' },

    // why: his own ← "your muffin" just before, and the 's is easy to lose, so the owner is unclear; share ← the name
    //   is caught but the "don't" is lost
    { id: 'd4', skill: 'detail', level: 'B1', point: 'phoebes', seg: [33.7, 42.45],
      stem: 'In Joey’s story, what did he tell the raccoon?',
      choices: ['Not to eat it, because it was Phoebe’s', 'Not to eat it, because it was his own',
                'To share it, because it was Phoebe’s'], a: 0,
      cue: '「I said」のあと、that’s のあと。',
      line: 'I said, “Hey, *don’t eat that. That’s Phoebe’s*.”',
      said: '「おい、食べるな、それはフィービーのだ」と言った、と話す。',
      mean: '持ち主の名前を言って、自分は止めた側だと見せている。',
      trap: 'don’t の t と名前のあとの ’s は聞き落としやすい。誰のものかは ’s で決まる。',
      use: 'Don’t touch that. That’s Sam’s.（触らないで、それはサムのだから）' },

    // why: blames Joey ← "Joey, you stink at…" heard as the raccoon accusing him of the theft; says sorry ← "don't eat
    //   that, that's Phoebe's" sets up an apology to Phoebe
    { id: 'hu2', skill: 'humor', level: 'C1', point: 'raccoon', reveals: ['stink'], seg: [36.4, 50.25],
      stem: 'Why does the end of Joey’s raccoon story get a laugh?',
      choices: ['His raccoon repeats the friend’s verdict on him', 'His raccoon accuses Joey of taking the muffin',
                'His raccoon says sorry to Phoebe for eating it'], a: 0,
      cue: '長い間のあと、アライグマのせりふ。',
      line: 'And he said… He said, “Joey, *you stink at lying*.”',
      said: '間があいて、アライグマが「ジョーイ、お前は嘘が下手だ」と言った、と続ける。',
      mean: '作り話の動物に、さっき言われた言葉を言わせた。嘘が続かず、自分で負けを認めた形。',
      trap: '動物が話すこと自体を笑いの元と考えやすい。誰の言葉をくり返したかを聞く。',
      use: 'Okay, okay, you got me.（はいはい、まいった）' },

    // C2: which reading of the question does the reply show? (cf. hu2)
    // anchor: 46.4–48.3 s the raccoon "says" "Joey, you stink at lying" (the friend's words from 23.2 s); 48.7–49.8 s
    //   "What am I gonna do?"; 50.3–52.8 s the reply "Don't worry… we'll come up with a good lie. I'll help you
    //   practice it" answers it as a plea for help
    // R fix: V2 (blind 50 % and right): "advice about the raccoon" became a near miss that also asks for help
    // why: make the story hold up ← he does want help, but the reply is about a new lie; sympathy ← the story
    //   taken as sincere, so he sounds upset about the muffin
    // retired: with nt3 out, one C2 alone is under 2; back with nt3 after its ear check
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'raccoon', reveals: ['stink', 'comeup'], seg: [44.9, 54.55], retired: true,
      stem: 'Right after the raccoon’s line, what is Joey really asking for?',
      choices: ['Help, now that he’s shown he can’t lie', 'Help to make his raccoon story hold up',
                'Sympathy, since the raccoon got the muffin'], a: 0,
      cue: '直後の返事が、何に答えているか。',
      line: 'He said, “Joey, you stink at lying.” *What am I gonna do?* — Don’t worry…',
      said: 'アライグマに「嘘が下手」と言わせ、「どうしよう」と続け、友だちが「大丈夫」と返す。',
      mean: '動物に負けを言わせ、そのまま自分の「どうしよう」に切りかえる。降参と助けを求める合図。',
      trap: '作り話の続きと取りやすい。返事が何に答えたかで、問いの意味を決める。',
      use: 'I can’t do this alone. Help?（一人じゃ無理。手伝って？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'comeup', seg: [49.8, 52.95],
      stem: 'Type what the friend promises: “We’ll ___ a good lie.” (3 words)', answer: 'come up with',
      cue: '「Don’t worry」を2回言ったあと。',
      line: 'Don’t worry… We’ll *come up with* a good lie.',
      said: '「心配しないで。うまい嘘を考えよう」と言う。',
      mean: 'come up with ＝（案や答えを）考え出す。idea や plan にも使う。',
      trap: '3語が一続きで、up が消えたように聞こえる。かたまりで覚える。',
      use: 'Let’s come up with a plan.（作戦を考えよう）' },

    // why: That'll ← the light d heard as a dark l (both fit an offer); It'll ← only the vowel and the l-like sound
    //   are caught
    { id: 's1', skill: 'sound', level: 'B2', point: 'thatd', seg: [49.8, 54.55],
      stem: 'Fill the gap: “Oh, great. ___ be great.”',
      choices: ['That’d', 'That’ll', 'It’ll'], a: 0,
      cue: '「Oh, great」のすぐあと、文頭の短い音。',
      line: 'Oh, great. *That’d* be great. Thank you.',
      said: '手伝うと言われ、「いいね、それは助かる」と答える。',
      mean: 'That’d ＝ That would。申し出を受けるときの決まった形。',
      trap: '’d は軽い「ド」で、’ll の「ル」と聞き分けにくい。申し出への返事は would の形が多い。',
      use: 'That’d be great, thanks.（それは助かる、ありがとう）' },

    // R fix: V2 and K6 (blind 55 % and right): the key was the only choice with a quoted gloss
    // why: checks ← "sure" read as "are you sure?"; agrees ← "sure" as "certainly", right after "That'd be great"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'sure', seg: [52.8, 56.85],
      stem: 'When Joey thanks the friend, what does the one-word reply do?',
      choices: ['Brushes off the thanks as no big deal', 'Checks that Joey really wants the help',
                'Agrees that the plan will be great'], a: 0,
      cue: 'お礼の直後の一語。',
      line: 'Thank you. — *Sure.* What— what was the work thing?',
      said: 'お礼に「いいよ」と軽く返し、すぐ仕事の用事について聞く。',
      mean: 'お礼への Sure は「どういたしまして」の軽い形。すぐ本題に移るときに使う。',
      trap: 'Sure を「確かに」「本当に？」と取りやすい。お礼の直後なら受け流しの返事。',
      use: 'Thanks for the ride! — Sure, anytime.（送ってくれてありがとう — いいよ、いつでも）' }
  ]
};
