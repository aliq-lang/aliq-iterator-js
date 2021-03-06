import * as A from "aliq"
import * as I from "iterator-lib"

export interface BagMap {
    set<T>(inputBag: A.ExternalInput<T>, input: Iterable<T>): void
    get<T>(bag: A.Bag<T>): Iterable<T>
}

export function createMap(): BagMap {
    const cache = new Map<object, object>();
    function mapGet<T>(bag: A.Bag<T>): Iterable<T>|undefined {
        return <Iterable<T>>cache.get(bag)
    }
    class Implementation implements BagMap {
        set<T>(inputBag: A.ExternalInput<T>, input: Iterable<T>): void {
            cache.set(inputBag, input)
        }
        get<T>(bag: A.Bag<T>): Iterable<T> {
            const cached = mapGet(bag)
            if (cached === undefined) {
                const created = this.create(bag)
                cache.set(bag, created)
                return created
            } else {
                return cached
            }
        }
        create<T>(bag: A.Bag<T>): Iterable<T> {
            switch (bag.type) {
                case "const":
                    return [bag.value]
                case "flatMap":
                    return this.createFlatMap(bag)
                case "merge":
                    return I.flatMap(bag.inputs, v => this.get(v))
                case "product":
                    return this.createProduct(bag)
                case "groupBy":
                    return this.createGroupBy(bag)
                case "externalInput":
                    throw "external input is not specified"
            }
        }
        createGroupBy<T, V>(bag: A.GroupBy<T, V>): Iterable<T> {
            const entries = I.entries(I.groupBy(this.get(bag.input), bag.reduce))
            return I.flatMap(entries, bag.flatMap)
        }
        createProduct<T, A, B>(bag: A.Product<T, A, B>): Iterable<T> {
            const a = this.get(bag.inputA)
            const b = this.get(bag.inputB)
            return I.flatMap(a, av => I.flatMap(b, bv => bag.func(av, bv)))
        }
        createFlatMap<T, I>(bag: A.FlatMap<T, I>): Iterable<T> {
            return I.flatMap(this.get(bag.input), bag.func)
        }
    }
    return new Implementation()
}