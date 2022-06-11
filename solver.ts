const isInWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

interface WebWorkerMessage {
    readonly Message   : "progress" | "complete"
    readonly Progress? : number
    readonly Result?   : SkillSolver.Rotation
}

if (isInWorker) {
    addEventListener("message", (e) => {
        const opt: SkillSolver.Option = e.data

        var data :WebWorkerMessage = {
            Message: "complete",
            Result: SkillSolver.Solve(opt)
        }

        postMessage(data)
    })
}

namespace SkillSolver {
    export type FindRule = number
    export const FindRules = {
        Expect  : 0, // 기대치가 높은 것
        Min     : 1, // 최소량이 제일 많은 것
        Max     : 2, // 최대량이 제일 많은 것
    }

    export type Action = number
    export const Actions = {
        Gathering : -1,
        Nothing   :  0,

        MountaineersGift1 : 1 <<  0, //    1   광맥의 선물 1	비옥토의 선물 1
        MountaineersGift2 : 1 <<  1, //    2   광맥의 선물 2	비옥토의 선물 2
        NaldthalsTidings  : 1 <<  2, //    4   날달의 복음		노피카의 복음
        KingsYield1       : 1 <<  3, //    8   왕의 수익 1		축복받은 수확 1
        KingsYield2       : 1 <<  4, //   16   왕의 수익 2		축복받은 수확 2
        SharpVision1      : 1 <<  5, //   32   뚜렷한 시야		현장 경험
        SharpVision2      : 1 <<  6, //   64   뚜렷한 시야 2	현장 경험 2
        SharpVision3      : 1 <<  7, //  128   뚜렷한 시야 3	현장 경험 3

        ClearVision       : 1 <<  8, //  256   맑은 시야		식물 전문가
        BountifulYield    : 1 <<  9, //  512   막대한 수익 2	막대한 수익 2
        SolidReason       : 1 << 10, // 1024   석공의 이론		농부의 지혜

        NotTemporaries    : ~(~0 <<  8), // 일회성 스킬이 아닌 스킬 사용
        All               : ~(~0 << 11), // 모든 스킬 사용
    }
    export const ActionList: Action[] = Object.values(Actions).filter(n => n > 0 && oneCount(n) == 1)

    export const GpUsage = {
        [ Actions.MountaineersGift1 ] :  50,
        [ Actions.MountaineersGift2 ] : 100,
        [ Actions.NaldthalsTidings  ] : 200,
        [ Actions.KingsYield1       ] : 400,
        [ Actions.KingsYield2       ] : 500,
        [ Actions.SharpVision1      ] :  50,
        [ Actions.SharpVision2      ] : 100,
        [ Actions.SharpVision3      ] : 250,
        [ Actions.ClearVision       ] :  50,
        [ Actions.BountifulYield    ] : 100,
        [ Actions.SolidReason       ] : 300,
    }

    export interface Option {
        readonly FindRule             : FindRule // 로테이션 목적
        readonly AvailableSkills      : Action   // 사용할 스킬들
        readonly Durability           : number   // 채집 횟수
        readonly GatherRatio          : number   // 성공 확률 [0, 1]
        readonly GatherAmount         : number   // 채집 개수
        readonly BonusRatio           : number   // 채집 보너스 확률, [0, 1]
        readonly BonusAmount          : number   // 채집 보너스 개수
        readonly Gp                   : number   // GP
        readonly GpRegen              : number   // 채집당 GP 회복량
        readonly BountifulYieldAmount : number   // 막대한 수확 개수
        readonly EnhancedSolidReason  : boolean  // 석공 특성 적용
    }

    export interface RotationStep {
        readonly Durataion?   : number
        readonly Action       : Action
        readonly Gp?          : number
        readonly GpDelta?     : number
        readonly Amount?      : Amount
        readonly AmountTotal? : Amount
    }

    export interface Rotation {
        readonly Option: Option

        readonly Milliseconds : number // 작업 시간
        readonly Combinations : number // 조합 경우의 수
        readonly Steps        : number // 전체 스텝 갯수

        readonly GpUsage    : number             // 사용 GP
        readonly Rotation   : RotationStep[]     // 로테이션
        readonly SkillCount : [Action, number][] // 사용 스킬 수

        readonly AmountDefault    : Amount // 스킬 없을 때 기대 수치
        readonly AmountWithSkills : Amount // 
    }

    export interface Amount {
        readonly Expect : number // 기대치
        readonly Min    : number // 최소
        readonly Max    : number // 최대
    }

    interface Statistics {
        Combinations : number
        Steps        : number
    }

    interface Result {
        readonly State     : State
        readonly ActionLog : Action[]
    }

    interface State {
        Steps   : number
        GpUsage : number // GP 사용량

        Durability   : number // 내구도
        Gp           : number // gp
        GatherRatio  : number // 성공 확률 [0, 1]
        GatherAmount : number // 채집 당 획득 수
        BonusRatio   : number // 채집 보너스 확률, [0, 1]
        BonusAmount  : number // 채집 보너스 개수

        AmountExpect : number
        AmountMin    : number
        AmountMax    : number
    }

    export function Solve(opt: Option): Rotation {
        const startedAt = new Date()

        let stat: Statistics = {
            Combinations : 0,
            Steps        : 0,
        }

        // 사용 가능한 스킬들을 미리 사전 필터링하기
        var availableSkills = opt.AvailableSkills

        // 획득력에 따라 적절한 스킬 제외
        switch (true) {
            case (opt.GatherRatio >= 1):
                availableSkills &= ~(Actions.ClearVision | Actions.SharpVision1 | Actions.SharpVision2 | Actions.SharpVision3)
                break

            case (opt.GatherRatio >= 0.95):
                availableSkills &= ~(Actions.ClearVision | Actions.SharpVision3)
                break

            case (opt.GatherRatio >= 0.85):
                availableSkills &= ~(Actions.SharpVision3)
                break
        }

        // 보너스가 100% 면 보너스 확률 관련 스킬 제외
        switch (true) {
            case (opt.BonusAmount >= 1):
                availableSkills &= ~(Actions.MountaineersGift1 | Actions.MountaineersGift2)
                break
            case (opt.BonusAmount >= 0.9):
                availableSkills &= ~(Actions.MountaineersGift2)
                break
        }

        const optInner: Option = {
            FindRule             : opt.FindRule,
            AvailableSkills      : availableSkills,
            Durability           : opt.Durability,
            GatherRatio          : opt.GatherRatio,
            GatherAmount         : opt.GatherAmount,
            BonusRatio           : opt.BonusRatio,
            BonusAmount          : opt.BonusAmount,
            Gp                   : opt.Gp,
            GpRegen              : opt.GpRegen,
            BountifulYieldAmount : opt.BountifulYieldAmount,
            EnhancedSolidReason  : opt.EnhancedSolidReason,
        }

        // 처음에 시작할 스킬을 정해줘서 가능성을 좀 줄여보기
        var actionTodoList: Action[] = []

        const defaultState = newState(optInner)
        let best: Result = {
            State        : defaultState,
            ActionLog    : Array<Action>(optInner.Durability).fill(Actions.Nothing),
        }
        for (let action: Action = 0; action < Actions.NotTemporaries; action++) {
            if ((action & availableSkills) == action && available(optInner, action)) {
                actionTodoList.push(action)
            }
        }

        for (let index = 0; index < actionTodoList.length; index++) {
            const action = actionTodoList[index]

            const cur = solve(optInner, stat, defaultState, action, [], best)
            if (!best || isBetterThan(optInner, cur.State, best.State, cur.ActionLog, best.ActionLog)) {
                best = cur
            }


            if (isInWorker) {
                var data :WebWorkerMessage = {
                    Message: "progress",
                    Progress : index / actionTodoList.length * 100
                }
                postMessage(data)
            }
        }

        const skillCountMap = new Map<number, number>()
        for (const stepAction of best.ActionLog) {
            for (const action of ActionList) {
                if (stepAction & action) {
                    skillCountMap.set(action, (skillCountMap.get(action) ?? 0) + 1)
                }
            }
        }

        return {
            Option: opt,

            Milliseconds : new Date().getTime() - startedAt.getTime(),
            Combinations : stat.Combinations,
            Steps        : stat.Steps,

            GpUsage    : best.State.GpUsage,
            SkillCount : Array.from(skillCountMap.entries()),
            Rotation   : simulate(optInner, best.ActionLog),

            AmountDefault: {
                Expect : defaultState.Durability * (defaultState.GatherAmount + defaultState.BonusAmount *    defaultState.BonusRatio       ) *    defaultState.GatherRatio,
                Min    : defaultState.Durability * (defaultState.GatherAmount + defaultState.BonusAmount * (+(defaultState.BonusRatio >= 1))) * (+(defaultState.GatherRatio >= 1)),
                Max    : defaultState.Durability * (defaultState.GatherAmount + defaultState.BonusAmount                                    ),
            },
            AmountWithSkills: {
                Expect : best.State.AmountExpect,
                Min    : best.State.AmountMin,
                Max    : best.State.AmountMax,
            },
        }
    }

    function newState(opt: Option): State {
        return {
            Steps        : 0,
            GpUsage      : 0,

            Durability   : opt.Durability,
            Gp           : opt.Gp,
            GatherRatio  : Math.min(1, opt.GatherRatio),
            GatherAmount : opt.GatherAmount,
            BonusRatio   : Math.min(1, opt.BonusRatio),
            BonusAmount  : opt.BonusAmount,

            AmountMin    : 0,
            AmountExpect : 0,
            AmountMax    : 0,
        }
    }

    function isBetterThan(opt: Option, a: State, b: State, aAction: Action[], bAction: Action[]): boolean {
        switch (opt.FindRule) {
            case FindRules.Expect:
                if (a.AmountExpect > b.AmountExpect) return true
                if (a.AmountExpect < b.AmountExpect) return false
                if (a.AmountMin > b.AmountMin) return true
                if (a.AmountMin < b.AmountMin) return false
                if (a.AmountMax > b.AmountMax) return true
                if (a.AmountMax < b.AmountMax) return false
                break

            case FindRules.Min:
                if (a.AmountMin > b.AmountMin) return true
                if (a.AmountMin < b.AmountMin) return false
                if (a.AmountExpect > b.AmountExpect) return true
                if (a.AmountExpect < b.AmountExpect) return false
                if (a.AmountMax > b.AmountMax) return true
                if (a.AmountMax < b.AmountMax) return false
                break

            case FindRules.Max:
                if (a.AmountMax > b.AmountMax) return true
                if (a.AmountMax < b.AmountMax) return false
                if (a.AmountExpect > b.AmountExpect) return true
                if (a.AmountExpect < b.AmountExpect) return false
                if (a.AmountMin > b.AmountMin) return true
                if (a.AmountMin < b.AmountMin) return false
                break
        }

        if (a.GpUsage < b.GpUsage) return true
        if (a.GpUsage > b.GpUsage) return false

        const min = Math.min(aAction.length, bAction.length)
        for (var idx = 0; idx < min; idx++) {
            if (aAction[idx] != Actions.Nothing && bAction[idx] == Actions.Nothing) return true
            if (aAction[idx] == Actions.Nothing && bAction[idx] != Actions.Nothing) return false
        }
        for (var idx = 0; idx < min; idx++) {
            const ao = oneCount(aAction[idx])
            const bo = oneCount(bAction[idx])
            
            if (ao > bo) return true
            if (ao < bo) return false
        }

        return false
    }

    function available(opt: Option, action: Action): boolean {
        // 6 땡기는 이유 = 석공의 이론 최대 횟수 3번 (gp 900 기준)
        var gp = opt.Gp + opt.GpRegen * (opt.Durability + 6)
        var gatherRatio = opt.GatherRatio
        var bonusRatio = opt.BonusRatio

        // 광맥의 선물 1	비옥토의 선물 1
        if (action & Actions.MountaineersGift1) {
            if (gp < 50 || bonusRatio >= 1) return false

            gp -= 50
            bonusRatio += 0.1
        }

        // 광맥의 선물 2	비옥토의 선물 2
        if (action & Actions.MountaineersGift2) {
            if (gp < 100 || bonusRatio >= 1) return false

            gp -= 100
            /**
            bonusRatio += 0.3f
            */
        }

        // 날달의 복음		노피카의 복음
        if (action & Actions.NaldthalsTidings) {
            if (gp < 200) return false

            gp -= 200
        }

        // 왕의 수익 1		축복받은 수확 1
        // 왕의 수익 2		축복받은 수확 2
        var kingsYield1 = action & Actions.KingsYield1
        var kingsYield2 = action & Actions.KingsYield2
        if (kingsYield1 && kingsYield2) return false

        if (kingsYield1) {
            if (gp < 400) return false

            gp -= 400
        }

        if (kingsYield2) {
            if (gp < 500) return false

            gp -= 500
        }

        // 뚜렷한 시야		현장 경험
        if (action & Actions.SharpVision1) {
            if (gp < 50 || gatherRatio >= 1) return false

            gp -= 50
            gatherRatio += 0.05
        }

        // 뚜렷한 시야 2	현장 경험 2
        if (action & Actions.SharpVision2) {
            if (gp < 100 || gatherRatio >= 1) return false

            gp -= 100
            gatherRatio += 0.15
        }

        // 뚜렷한 시야 3	현장 경험 3
        if (action & Actions.SharpVision3) {
            if (gp < 250 || gatherRatio >= 1) return false

            /**
            gp -= 250
            gatherRatio += 0.5f
            */
        }

        return true
    }

    function step(opt: Option, curState: State, action: Action, skip: boolean = true): State | undefined {
        let Gp           = curState.Gp
        let GpUsage      = curState.GpUsage
        let GatherRatio  = curState.GatherRatio
        let GatherAmount = curState.GatherAmount
        let BonusRatio   = curState.BonusRatio
        let BonusAmount  = curState.BonusAmount

        // 광맥의 선물 1	비옥토의 선물 1
        if (action & Actions.MountaineersGift1) {
            if (Gp < 50) return undefined

            GpUsage += 50
            Gp -= 50
            BonusRatio += 0.1
        }

        // 광맥의 선물 2	비옥토의 선물 2
        if (action & Actions.MountaineersGift2) {
            if (Gp < 100) return undefined

            GpUsage += 100
            Gp -= 100
            BonusRatio += 0.3
        }

        // 날달의 복음		노피카의 복음
        if (action & Actions.NaldthalsTidings) {
            if (Gp < 200) return undefined

            GpUsage += 200
            Gp -= 200
            BonusAmount += 1
        }

        // 왕의 수익 1		축복받은 수확 1
        if (action & Actions.KingsYield1) {
            if (Gp < 400) return undefined

            GpUsage += 400
            Gp -= 400
            GatherAmount += 1
        }

        // 왕의 수익 2		축복받은 수확 2
        if (action & Actions.KingsYield2) {
            if (Gp < 500) return undefined

            GpUsage += 500
            Gp -= 500
            GatherAmount += 2
        }

        // 뚜렷한 시야		현장 경험
        if (action & Actions.SharpVision1) {
            if (Gp < 50 || GatherRatio >= 1) return undefined

            GpUsage += 50
            Gp -= 50
            GatherRatio += 0.05
        }

        // 뚜렷한 시야 2	현장 경험 2
        if (action & Actions.SharpVision2) {
            if (Gp < 100 || GatherRatio >= 1 - 0.1) return undefined

            GpUsage += 100
            Gp -= 100
            GatherRatio += 0.15
        }

        // 뚜렷한 시야 3	현장 경험 3
        if (action & Actions.SharpVision3) {
            if (Gp < 250 || GatherRatio >= 1 - 0.25) return undefined

            GpUsage += 250
            Gp -= 250
            GatherRatio += 0.5
        }

        // 막대한 수익 2	막대한 수익 2
        var bountifulYield = action & Actions.BountifulYield
        if (bountifulYield) {
            if (Gp < 100) return undefined

            GpUsage += 100
            Gp -= 100
        }

        // 석공의 이론		농부의 지혜
        var solidReason = action & Actions.SolidReason
        if (solidReason) {
            if (Gp < 300) return undefined

            GpUsage += 300
            Gp -= 300
        }

        // 맑은 시야		맑은 시야
        var clearVision = action & Actions.ClearVision
        if (clearVision) {
            if (Gp < 50 || GatherRatio >= 1) return undefined

            GpUsage += 50
            Gp -= 50
        }

        let n: State = {
            Steps        : curState.Steps + 1,
            GpUsage      : GpUsage,
            Durability   : curState.Durability - (solidReason ? 0 : 1),
            Gp           : Gp + opt.GpRegen,
            GatherRatio  : GatherRatio,
            GatherAmount : GatherAmount,
            BonusRatio   : BonusRatio,
            BonusAmount  : BonusAmount,
            AmountExpect : curState.AmountExpect,
            AmountMin    : curState.AmountMin,
            AmountMax    : curState.AmountMax,
        }

        var gatherRatio = Math.min(n.GatherRatio + (clearVision ? 0.15 : 0), 1)
        var bonusRatio = Math.min(n.BonusRatio, 1)

        n.AmountExpect += (n.GatherAmount + n.BonusAmount * bonusRatio) * gatherRatio * (solidReason && opt.EnhancedSolidReason ? 1.5 : 1)
        if (bountifulYield) n.AmountExpect += opt.BountifulYieldAmount * gatherRatio

        if (gatherRatio >= 1) {
            n.AmountMin += n.GatherAmount

            if (bonusRatio >= 1) n.AmountMin += n.BonusAmount
            if (bountifulYield)  n.AmountMin += opt.BountifulYieldAmount
        }

        n.AmountMax += (n.GatherAmount + n.BonusAmount) * (solidReason && opt.EnhancedSolidReason ? 2 : 1)
        if (bountifulYield) n.AmountMax += opt.BountifulYieldAmount

        // 앞으로 사용할 수 있는 스킬이 있나 확인
        if (skip && n.Gp + opt.GpRegen * n.Durability < 50) {
            gatherRatio = Math.min(n.GatherRatio, 1)

            n.AmountExpect += (n.GatherAmount + n.BonusAmount * bonusRatio) * gatherRatio * n.Durability

            if (gatherRatio >= 1) {
                n.AmountMin += n.GatherAmount * n.Durability
                if (n.BonusAmount >= 1) n.AmountMin += n.BonusAmount * n.Durability
            }

            n.AmountMax += (n.GatherAmount + n.BonusAmount) * n.Durability

            n.Durability = 0
        }

        return n
    }

    function solve(opt: Option, stat: Statistics, curState: State, todo: Action, actionLog: Action[], best: Result): Result {
        if (curState.Durability == 0) {
            stat.Combinations++

            if (!isBetterThan(opt, curState, best.State, actionLog, best.ActionLog)) {
                return best
            }

            return {
                ActionLog : [...actionLog],
                State     : curState,
            }
        }

        // 내구도가 1 남으면 쓸 수 있는 모든 스킬 사용
        if (curState.Durability == 1) return solveInner(opt, stat, curState, todo, todo, actionLog, best)

        if (todo == Actions.Nothing) return solveInner(opt, stat, curState, todo, todo, actionLog, best)

        const todoSet = new Set<Action>()
        for (let action: Action = 0; action < Actions.NotTemporaries; action++) {
            if ((action & todo) != action) continue

            todoSet.add(todo & action)
        }

        for (const action of todoSet) {
            best = solveInner(opt, stat, curState, todo, action, actionLog, best)
        }

        return best
    }

    function solveInner(opt: Option, stat: Statistics, curState: State, todo: Action, action: Action, actionLog: Action[], best: Result): Result {
        best = solveBody(opt, stat, curState, todo, action, actionLog, best)

        if (curState.Gp >= 100) best = solveBody(opt, stat, curState, todo, action | Actions.BountifulYield, actionLog, best)
        if (curState.GatherRatio < 1) {
            if (curState.Gp >= 50) best = solveBody(opt, stat, curState, todo, action | Actions.ClearVision, actionLog, best)
            if (curState.Gp >= 100 + 50) best = solveBody(opt, stat, curState, todo, action | Actions.ClearVision | Actions.BountifulYield, actionLog, best)
        }
        if (curState.Steps > 0) {
            if (curState.Gp >= 300) best = solveBody(opt, stat, curState, todo, action | Actions.SolidReason, actionLog, best)
            if (curState.Gp >= 300 + 100) best = solveBody(opt, stat, curState, todo, action | Actions.SolidReason | Actions.BountifulYield, actionLog, best)
            if (curState.GatherRatio < 1) {
                if (curState.Gp >= 300 + 50) best = solveBody(opt, stat, curState, todo, action | Actions.SolidReason | Actions.ClearVision, actionLog, best)
                if (curState.Gp >= 300 + 150) best = solveBody(opt, stat, curState, todo, action | Actions.SolidReason | Actions.ClearVision | Actions.BountifulYield, actionLog, best)
            }
        }

        return best
    }

    function solveBody(opt: Option, stat: Statistics, curState: State, todo: Action, action: Action, actionLog: Action[], best: Result): Result {
        if (action != Actions.Nothing && (action & opt.AvailableSkills) != action) return best

        const nextState = step(opt, curState, action)
        if (!nextState) return best

        stat.Steps++

        actionLog.push(action)
        best = solve(opt, stat, nextState, todo & ~action, actionLog, best)
        actionLog.pop()

        return best
    }

    function simulate(opt: Option, actionLog: Action[]): RotationStep[] {
        var lst: RotationStep[] = []

        // 기본 상태
        lst.push({
            Action    : Actions.Nothing,
            Durataion : opt.Durability,
            Gp : opt.Gp,
        })

        var state = newState(opt)
        var befAmountExpect = 0
        var befAmountMax = 0
        var befAmountMin = 0
        for (const actionFlag of actionLog) {
            if (actionFlag > 0) {
                lst.push({
                    Action : actionFlag,
                })
            }

            state = step(opt, state, actionFlag, false)!
            lst.push({
                Action    : Actions.Gathering,
                Durataion : state.Durability,
                Gp        : state.Gp,
                GpDelta   : opt.GpRegen,

                Amount : {
                    Expect : state.AmountExpect - befAmountExpect,
                    Max    : state.AmountMax    - befAmountMax,
                    Min    : state.AmountMin    - befAmountMin,
                },

                AmountTotal : {
                    Expect : state.AmountExpect,
                    Max    : state.AmountMax,
                    Min    : state.AmountMin,
                },
            })

            befAmountExpect = state.AmountExpect
            befAmountMax = state.AmountMax
            befAmountMin = state.AmountMin
        }

        // 최종 상태
        while (state.Durability > 0) {
            state = step(opt, state, Actions.Nothing, false)!
            lst.push({
                Action    : Actions.Gathering,
                Durataion : state.Durability,
                Gp        : state.Gp,
                GpDelta   : opt.GpRegen,

                Amount : {
                    Expect : state.AmountExpect - befAmountExpect,
                    Max    : state.AmountMax    - befAmountMax,
                    Min    : state.AmountMin    - befAmountMin,
                },

                AmountTotal : {
                    Expect : state.AmountExpect,
                    Max    : state.AmountMax,
                    Min    : state.AmountMin,
                },
            })
            befAmountExpect = state.AmountExpect
            befAmountMax = state.AmountMax
            befAmountMin = state.AmountMin
        }

        return lst
    }

    // https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
    function oneCount(n: number): number {
        n = n - ((n >> 1) & 0x55555555)
        n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
        return (((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24)
    }
}