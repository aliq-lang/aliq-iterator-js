import "mocha"
import * as A from "aliq"
import * as _ from "../index"
import * as chai from "chai"
import * as I from "iterator-lib"

chai.should()

describe("createMap", () => {
    it("externalInput", () => {
        const map = _.createMap()
        const input = A.externalInput<string>()
        map.set(input, ["1", "2", "3"])
        const x = Array.from(map.get(input))
        x.should.deep.equal(["1", "2", "3"])
    })
    it("const", () => {
        const map = _.createMap()
        const input = A.const_("hello")
        const x = Array.from(map.get(input))
        x.should.deep.equal(["hello"])
    })
    it("flatMap", () => {
        const map = _.createMap()
        const input = A.const_([1, 2, 3])
        const fm = A.flatMap(input, v => v)
        const result = Array.from(map.get(fm))
        result.should.deep.equal([1, 2, 3])
    })
    it("merge", () => {
        const map = _.createMap()
        const a = A.flatMap(A.const_([1, 2, 3]), v => v)
        const b = A.externalInput<number>()
        const merge = A.merge(a, b)
        map.set(b, [12, 13, 14])
        const result = Array.from(map.get(merge))
        result.should.deep.equal([1, 2, 3, 12, 13, 14])
    })
    it("product", () => {
        const map = _.createMap()
        const a = A.externalInput<number>()
        const b = A.externalInput<number>()
        map.set(a, [1, 2, 3])
        map.set(b, [5, 7, 11])
        const p = A.product(a, b, (av, bv) => [av * bv])
        const result = Array.from(map.get(p))
        result.should.deep.equal([5, 7, 11, 10, 14, 22, 15, 21, 33])
    })
    it("groupBy", () => {
        const map = _.createMap()
        const a = A.flatMap(A.const_(["a", "b", "c", "a"]), v => v)
        const p = A.flatMap(a, v => [I.nameValue(v, 1)])
        const g = A.groupBy(p, (av, bv) => av + bv, v => [v])
        const result = I.toObject(map.get(g))
        result.should.deep.equal({ a: 2, b: 1, c: 1 })
    })
    it("throw", () => {
        const map = _.createMap()
        const input = A.externalInput<string>()
        chai.assert.throw(() => map.get(input))
    })
})