interface SkillInfo {
    readonly Lv          : number
    readonly GP          : number
    readonly IsGameSkill : boolean
    readonly Name        : [string, string] // Miner, Botanist
    readonly Desc        : string
}

const EmhanedSolidReason = -2
const SkillsMap: { [key: number]: SkillInfo } = {
    [ SkillSolver.Actions.Gathering         ] : { Lv:  0, GP:   0, IsGameSkill: false, Name: [ "채집"         , "채집"            ], Desc: "",                               },

    [ SkillSolver.Actions.SharpVision1      ] : { Lv:  4, GP:  50, IsGameSkill: true , Name: [ "뚜렷한 시야"  , "현장 경험"       ], Desc: "획득률 5% 증가",                 },
    [ SkillSolver.Actions.SharpVision2      ] : { Lv:  5, GP: 100, IsGameSkill: true , Name: [ "뚜렷한 시야 2", "현장 경험 2"     ], Desc: "획득률 15% 증가",                },
    [ SkillSolver.Actions.SharpVision3      ] : { Lv: 10, GP: 250, IsGameSkill: true , Name: [ "뚜렷한 시야 3", "현장 경험 3"     ], Desc: "획득률 50% 증가",                },
    [ SkillSolver.Actions.ClearVision       ] : { Lv: 23, GP:  50, IsGameSkill: true , Name: [ "맑은 시야"    , "식물 전문가"     ], Desc: "다음 1회 획득률 15% 증가",       },

    [ SkillSolver.Actions.MountaineersGift1 ] : { Lv: 15, GP:  50, IsGameSkill: true , Name: [ "광맥의 선물 1", "비옥토의 선물 1" ], Desc: "획득 수 보너스 발생률 + 10%",    },
    [ SkillSolver.Actions.MountaineersGift2 ] : { Lv: 50, GP: 100, IsGameSkill: true , Name: [ "광맥의 선물 2", "비옥토의 선물 2" ], Desc: "획득 수 보너스 발생률 + 30%",    },
    [ SkillSolver.Actions.NaldthalsTidings  ] : { Lv: 81, GP: 200, IsGameSkill: true , Name: [ "날달의 복음"  , "노피카의 복음"   ], Desc: "획득 수 보너스 발생 시 갯수 +1", },

    [ SkillSolver.Actions.KingsYield1       ] : { Lv: 30, GP: 400, IsGameSkill: true , Name: [ "왕의 수익 1"  , "축복받은 수확 1" ], Desc: "1회 채집 당 아이템 개수 + 1",    },
    [ SkillSolver.Actions.KingsYield2       ] : { Lv: 40, GP: 500, IsGameSkill: true , Name: [ "왕의 수익 2"  , "축복받은 수확 2" ], Desc: "1회 채집 당 아이템 개수 + 2",    },
    [ SkillSolver.Actions.BountifulYield    ] : { Lv: 24, GP: 100, IsGameSkill: true , Name: [ "막대한 수익"  , "막대한 수확"     ], Desc: "다음 1회 채집량 증가",           },

    [ SkillSolver.Actions.SolidReason       ] : { Lv: 25, GP: 300, IsGameSkill: true , Name: [ "석공의 이론"  , "농부의 지혜"     ], Desc: "내구도 1 회복",                  },
    [ EmhanedSolidReason                    ] : { Lv: 90, GP:  50, IsGameSkill: true , Name: [ "샘솟는 지혜"  , "샘솟는 지혜"     ], Desc: "내구도 1 회복 (90레벨 특성)",    },
}

const SkillOptionList = [
    SkillSolver.Actions.SharpVision1,
    SkillSolver.Actions.SharpVision2,
    SkillSolver.Actions.SharpVision3,
    SkillSolver.Actions.ClearVision,
    -1,
    SkillSolver.Actions.BountifulYield,
    SkillSolver.Actions.KingsYield1,
    SkillSolver.Actions.KingsYield2,
    -1,
    SkillSolver.Actions.MountaineersGift1,
    SkillSolver.Actions.MountaineersGift2,
    SkillSolver.Actions.NaldthalsTidings,
    -1,
    SkillSolver.Actions.SolidReason,
    EmhanedSolidReason
]

function archiveSave(result? : SkillSolver.Rotation) {
    const miner = (document.getElementById("miner") as HTMLInputElement | null)?.checked ?? true
    localStorage.setItem("miner" , miner ? "1" : "0")

    if (result) {
        localStorage.setItem("result", JSON.stringify(result))
    } else {
        localStorage.removeItem("result")
    }

    const opt = result?.Option ?? getOption()
    localStorage.setItem("opt", JSON.stringify(opt))
}

function archiveLoad() {
    const minerStr = localStorage.getItem("miner")
    if (minerStr) {
        if (minerStr == "1") {
            const elem = document.getElementById("miner") as HTMLInputElement | null
            if (elem) elem.checked = true
        } else {
            const elem = document.getElementById("botanist") as HTMLInputElement | null
            if (elem) elem.checked = true
        }
    }

    const resultStr = localStorage.getItem("result")
    if (resultStr) {
        const result: SkillSolver.Rotation | null = JSON.parse(resultStr)
        if (result) {
            drawResult(result, false)
        }
    }

    const optStr = localStorage.getItem("opt")
    if (optStr) {
        const opt: SkillSolver.Option | null = JSON.parse(optStr)
        if (opt) {
            const setValue = (id: string, value: string | number) => {
                const elem = document.getElementById(id) as HTMLInputElement | null
                if (elem) elem.value = typeof value === "string" ? value : (value.toFixed(0));
            }
            const setChecked = (id: string) => {
                const elem = document.getElementById(id) as HTMLInputElement | null
                if (elem) elem.checked = true
            }

            setValue("inputDurability"          , opt.Durability)
            setValue("inputGatherRatio"         , opt.GatherRatio * 100)
            setValue("inputGatherAmount"        , opt.GatherAmount)
            setValue("inputBonusRatio"          , opt.BonusRatio * 100)
            setValue("inputBonusAmount"         , opt.BonusAmount)
            setValue("inputGp"                  , opt.Gp)
            setValue("inputGpRegen"             , opt.GpRegen)
            setValue("inputBountifulYieldAmount", opt.BountifulYieldAmount)

            switch (opt.FindRule) {
                case SkillSolver.FindRules.Expect : setChecked("FindRuleAspect"); break
                case SkillSolver.FindRules.Min    : setChecked("FindRuleMin"   ); break
                case SkillSolver.FindRules.Max    : setChecked("FindRuleMax"   ); break
            }

            for (const action of SkillSolver.ActionList) {
                const elem = document.getElementById(`inputSkill_${action}`) as HTMLInputElement | null
                if (elem?.checked) {
                    elem.checked = (action & opt.AvailableSkills) == action
                }
            }
        }
    }
}

function numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatAmount(amount: SkillSolver.Amount | undefined, wrap: boolean = false): string {
    if (!amount) return ""

    if (wrap)
        return `<span class="font-monospace">${amount.Expect.toFixed(1)}</span><br />
<span class="text_small font-monospace">${amount.Min.toFixed(0)} - ${amount.Max.toFixed(0)}</span>`
    else
        return `<span class="font-monospace">${amount.Expect.toFixed(1)} (${amount.Min.toFixed(0)} - ${amount.Max.toFixed(0)})</span>`
}

function initInputSkills() {
    var inputSkillsBody = document.getElementById("inputSkillsBody")
    if (inputSkillsBody) {
        for (let idx = 0; idx < SkillOptionList.length; idx++) {
            const action = SkillOptionList[idx];
            
            const skill = SkillsMap[action]
            if (!skill.IsGameSkill) continue;

            let bottom = idx + 1 < SkillOptionList.length && SkillOptionList[idx + 1] == -1 ? "skill_table_bottom" : ""

            inputSkillsBody!.innerHTML += `
            <tr>
                <th class="${bottom} text-center"><input class="form-check-input big_checkbox" type="checkbox" id="inputSkill_${action}" checked></th>
                <td class="${bottom} text-center"><span class="font-monospace">${skill.Lv}<span></td>
                <td class="${bottom}">
                    <span class="miner"><div class="skill_icon"><img width="32" height="32" src="img/miner/${action}.png"></div> ${skill.Name[0]}</span>
                    <span class="botanist"><div class="skill_icon"><img width="32" height="32" src="img/botanist/${action}.png"></div> ${skill.Name[1]}</span>
                </td>
                <td class="${bottom} text-center"><span class="font-monospace">${skill.GP}<span></td>
                <td class="${bottom}">${skill.Desc}</td>
            </tr>
            `
        }
    }
}

let worker: Worker | undefined = undefined

function initWorker() {
    if (!!window.Worker) {
        if (worker) worker.terminate()

        worker = new Worker("solver.js")
        worker.addEventListener(
            "message",
            (e) => {
                const data: WebWorkerMessage = e.data

                switch (data.Message) {
                    case "progress":
                        {
                            const progress = document.getElementById("progress")
                            if (progress) {
                                const v = data.Progress!.toFixed(0) + "%"
                                progress.style.width = v
                                progress.innerText = v
                            }
                        }
                        break

                    case "complete":
                        drawResult(data.Result!)
                        break
                }
            }
        )
        worker.addEventListener(
            "error",
            () => drawResult(undefined)
        )
    }
}

function getOption(): SkillSolver.Option {
    let FindRule = SkillSolver.FindRules.Expect
    switch ((document.querySelector('input[name="FindRule"]:checked') as HTMLInputElement | null)?.value ?? "") {
        case "Aspect" : FindRule = SkillSolver.FindRules.Expect; break
        case "Min"    : FindRule = SkillSolver.FindRules.Min   ; break
        case "Max"    : FindRule = SkillSolver.FindRules.Max   ; break
    }

    let AvailableSkills = SkillSolver.Actions.Nothing
    for (const action of SkillSolver.ActionList) {
        if ((document.getElementById(`inputSkill_${action}`) as HTMLInputElement | null)?.checked ?? false) {
            AvailableSkills |= action
        }
    }

    let opt: SkillSolver.Option = {
        FindRule             : FindRule,
        AvailableSkills      : AvailableSkills,
        Durability           : Number((document.getElementById("inputDurability"          ) as HTMLInputElement | null)?.value),
        GatherRatio          : Number((document.getElementById("inputGatherRatio"         ) as HTMLInputElement | null)?.value) / 100.0,
        GatherAmount         : Number((document.getElementById("inputGatherAmount"        ) as HTMLInputElement | null)?.value),
        BonusRatio           : Number((document.getElementById("inputBonusRatio"          ) as HTMLInputElement | null)?.value) / 100.0,
        BonusAmount          : Number((document.getElementById("inputBonusAmount"         ) as HTMLInputElement | null)?.value),
        Gp                   : Number((document.getElementById("inputGp"                  ) as HTMLInputElement | null)?.value),
        GpRegen              : Number((document.getElementById("inputGpRegen"             ) as HTMLInputElement | null)?.value),
        BountifulYieldAmount : Number((document.getElementById("inputBountifulYieldAmount") as HTMLInputElement | null)?.value),

        EnhancedSolidReason  : (document.getElementById(`inputSkill_${EmhanedSolidReason}`) as HTMLInputElement | null)?.checked ?? false,
    }

    return opt
}

function solve() {
    const solveBtn = document.getElementById("solve")
    if (solveBtn) {
        solveBtn.classList.add("disabled")
        solveBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`
    }

    if (worker) {
        var cancelBtn = document.getElementById("cancel")
        if (cancelBtn) {
            cancelBtn.classList.remove("disabled")
        }
    }

    const progress = document.getElementById("progress")
    if (progress) {
        progress.innerText = "0%"
        progress.style.width = "0%"
    }

    const opt = getOption()
    archiveSave(undefined)
    if (worker) {
        worker.postMessage(opt)
    } else {
        drawResult(SkillSolver.Solve(opt))
    }
}

function cancelSolve() {
    if (worker) {
        initWorker()

        var cancelBtn = document.getElementById("cancel")
        if (cancelBtn) {
            cancelBtn.classList.add("disabled")
        }

        drawResult(undefined)
    }
}

function drawResult(rotation: SkillSolver.Rotation | undefined, enableSave: boolean = true) {
    if (rotation && enableSave) {
        archiveSave(rotation)
    }

    const solveBtn = document.getElementById("solve")
    if (solveBtn) {
        solveBtn.classList.remove("disabled")
        solveBtn.innerText = `로테이션 찾기`
    }

    const cancelBtn = document.getElementById("cancel")
    if (cancelBtn) {
        cancelBtn.classList.add("disabled")
    }

    const progress = document.getElementById("progress")
    if (progress) {
        progress.innerText = "0%"
        progress.style.width = "0%"
    }

    const setInnerHTML = (id: string, text: string) => {
        const elem = document.getElementById(id)
        if (elem) elem.innerHTML = text
    }
    if (!rotation) {
        setInnerHTML("outputStatisticsTime"  , `<span class="text-danger fw-bold">오류 발생</span>`)
        setInnerHTML("outputStatisticsInfo"  , ``)

        setInnerHTML("outputAmountDefault"   , ``)
        setInnerHTML("outputAmountWithSkills", ``)

        const outputSkillCountBody = document.getElementById("outputSkillCountBody")
        if (outputSkillCountBody) {
            outputSkillCountBody.innerHTML = ""
        }

        const outputRotationBody = document.getElementById("outputRotationBody")
        if (outputRotationBody) {
            outputRotationBody.innerHTML = ""
        }

        const outputSkillCountFootGP = document.getElementById("outputSkillCountFootGP")
        if (outputSkillCountFootGP) {
            outputSkillCountFootGP.innerText = "0"
        }
    
        const outputSkillCountFootCount = document.getElementById("outputSkillCountFootCount")
        if (outputSkillCountFootCount) {
            outputSkillCountFootCount.innerText = "0"
        }

        return
    }

    setInnerHTML("outputStatisticsTime"  , `<span class="font-monospace">${(rotation.Milliseconds / 1000.0).toFixed(3)} s</code>`)
    setInnerHTML("outputStatisticsInfo"  , `조합 수 : <span class="font-monospace">${numberWithCommas(rotation.Combinations)}</span><br>
반복 수 : <span class="font-monospace">${numberWithCommas(rotation.Steps)}</span>`)

    setInnerHTML("outputAmountDefault"   , formatAmount(rotation.AmountDefault   ))
    setInnerHTML("outputAmountWithSkills", formatAmount(rotation.AmountWithSkills))

    const miner    = (document.getElementById("miner"   ) as HTMLInputElement | null)?.checked
    const botanist = (document.getElementById("botanist") as HTMLInputElement | null)?.checked

    let countSum = 0

    const outputSkillCountBody = document.getElementById("outputSkillCountBody")
    if (outputSkillCountBody) {
        outputSkillCountBody.innerHTML = ""

        let idx = 0
        for (const [ action, count ] of rotation.SkillCount.sort((a, b) => SkillOptionList.indexOf(a[0]) - SkillOptionList.indexOf(b[0]))) {
            const skill = SkillsMap[action]

            countSum += count

            idx++
            outputSkillCountBody.innerHTML +=
                `
                <tr>
                    <th scope="row" class="text-center">${idx}</th>
                    <td>
                        <span class="${miner    ? "" : "d-none "}miner"><div class="skill_icon"><img width="32" height="32" src="img/miner/${action}.png"></div> ${(skill.Name[0])}</span>
                        <span class="${botanist ? "" : "d-none "}botanist"><div class="skill_icon"><img width="32" height="32" src="img/botanist/${action}.png"></div> ${(skill.Name[1])}</span>
                    </td>
                    <td class="text-center"><span class="font-monospace">${SkillsMap[action]?.GP ?? ""}</span></td>
                    <td class="text-center"><span class="font-monospace">${count}</span></td>
                </tr>
                    `
        }
    }

    const outputSkillCountFootGP = document.getElementById("outputSkillCountFootGP")
    if (outputSkillCountFootGP) {
        outputSkillCountFootGP.innerText = numberWithCommas(rotation.GpUsage)
    }

    const outputSkillCountFootCount = document.getElementById("outputSkillCountFootCount")
    if (outputSkillCountFootCount) {
        outputSkillCountFootCount.innerText = countSum.toString()
    }

    const outputRotationBody = document.getElementById("outputRotationBody")
    if (outputRotationBody) {
        outputRotationBody.innerHTML = ""

        var fullRotation: SkillSolver.RotationStep[] = []

        let befGP = 0
        let befDura = 0
        for (const step of rotation.Rotation) {
            if (step.Action == SkillSolver.Actions.Gathering || step.Action == SkillSolver.Actions.Nothing) {
                befDura = step.Durataion ?? 0
                befGP = step.Gp ?? 0
                fullRotation.push(step)
            } else {
                var curActionList = SkillSolver.ActionList
                    .filter((value, _index, _array) => (value & step.Action) == value)
                    .filter((value, _index, _array) => value > 0)
                    .sort((a, b) => SkillOptionList.indexOf(a) - SkillOptionList.indexOf(b))
                
                for (const action of curActionList) {
                    befGP -= SkillSolver.GpUsage[action]
                    fullRotation.push({
                        Action    : action,
                        Gp        : befGP,
                        GpDelta   : -SkillSolver.GpUsage[action],
                        Durataion : action == SkillSolver.Actions.SolidReason ? befDura + 1 : undefined,
                    })
                }
            }
        }

        let idx = 0
        for (const step of fullRotation) {
            const skill = SkillsMap[step.Action]
            const background = (step.Action == SkillSolver.Actions.Gathering || step.Action == SkillSolver.Actions.Nothing)

            if (step.Action == SkillSolver.Actions.Gathering) idx++

            let html =
                `
                <tr${ background ? ` class="table-light"` : ""}>
                    <th scope="row" class="text-center">${background ? idx : ""}</th>
                    <td>
                `

            if (skill) {
                if (skill.IsGameSkill) {
                    html +=
                        `
                        <span class="${miner    ? "" : "d-none "}miner"><div class="skill_icon"><img width="32" height="32" src="img/miner/${step.Action}.png"></div> ${(skill.Name[0])}</span>
                        <span class="${botanist ? "" : "d-none "}botanist"><div class="skill_icon"><img width="32" height="32" src="img/botanist/${step.Action}.png"></div> ${(skill.Name[1])}</span>
                        `
                } else {
                    html +=
                        `
                        <span class="${miner    ? "" : "d-none "}miner">${(skill.Name[0])}</span>
                        <span class="${botanist ? "" : "d-none "}botanist">${(skill.Name[1])}</span>
                        `
                }
            }
            html +=
                `
                </td>
                <td class="text-center">${step.Durataion ?? ""}</td>
                `

            if (step.GpDelta && step.GpDelta != 0) {
                if (step.GpDelta > 0) {
                    html +=
                        `
                        <td class="text-center lh-sm font-monospace">
                            <span class="text_small text-success ">+${step.GpDelta}</span><br>
                            <span class="font-monospace">${step.Gp ?? ""}</span>
                        </td>
                        `
                } else  {
                    html +=
                        `
                        <td class="text-center lh-sm font-monospace">
                            <span class="text_small text-danger">-${Math.abs(step.GpDelta)}</span><br>
                            <span class="font-monospace">${step.Gp ?? ""}</span>
                        </td>
                        `
                }
            } else {
                html +=
                    `
                    <td class="text-center">
                        <span class="font-monospace">${step.Gp ?? ""}</span>
                    </td>
                    `
            }
            html +=
                `
                    <td class="text-center lh-sm">${formatAmount(step.Amount     , true)}</td>
                    <td class="text-center lh-sm">${formatAmount(step.AmountTotal, true)}</td>
                </tr>
                `

            outputRotationBody.innerHTML += html
        }
    }
}

function JobChanged() {
    const miner    = (document.getElementById("miner"   ) as HTMLInputElement | null)?.checked
    const botanist = (document.getElementById("botanist") as HTMLInputElement | null)?.checked

    Array.from(document.getElementsByClassName("miner"   )).forEach((elem, _index, _array) =>  miner    ? elem.classList.remove("d-none") : elem.classList.add("d-none"))
    Array.from(document.getElementsByClassName("botanist")).forEach((elem, _index, _array) =>  botanist ? elem.classList.remove("d-none") : elem.classList.add("d-none"))
}

document.addEventListener(
    "DOMContentLoaded",
    function() {
        initWorker()

        initInputSkills()

        document.getElementById("miner"   )?.addEventListener("change", JobChanged)
        document.getElementById("botanist")?.addEventListener("change", JobChanged)
        JobChanged()

        document.getElementById("solve" )?.addEventListener("click", solve      )
        document.getElementById("cancel")?.addEventListener("click", cancelSolve)

        archiveLoad()
    }
)

document.addEventListener(
    "beforeunload",
    function() {
        archiveSave()
    }
)