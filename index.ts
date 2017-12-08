import * as Aliq from "aliq"
import * as I from "iterator-lib"

export interface BagMap {
    set<T>(inputBag: Aliq.ExternalInput<T>, input: Iterable<T>): void
    get<T>(bag: Aliq.Bag<T>): Iterable<T>
}

export function createMap(): BagMap {
    const cache = new Map<object, object>();
    function mapGet<T>(bag: Aliq.Bag<T>): Iterable<T>|undefined {
        return <Iterable<T>>cache.get(bag)
    }
    function createFlatMap<T, I>(bag: Aliq.FlatMap<T, I>): Iterable<T> {
        return I.flatMap(get(bag.input), bag.func)
    }
    function createProduct<T, A, B>(bag: Aliq.Product<T, A, B>): Iterable<T> {
        const a = get(bag.inputA)
        const b = get(bag.inputB)
        return I.flatMap(a, av => I.flatMap(b, bv => bag.func(av, bv)))
    }
    function create<T>(bag: Aliq.Bag<T>): Iterable<T> {
        switch (bag.type) {
            case "const":
                return [bag.value]
            case "flatMap":
                return createFlatMap(bag)
            case "merge":
                return I.flatMap(bag.inputs, get)
            case "product":
                return createProduct(bag)
            case "groupBy":
                return I.values(I.groupBy(get(bag.input), bag.getKey, bag.reduce))
            case "externalInput":
                throw "external input is not specified"
        }
    }
    function get<T>(bag: Aliq.Bag<T>): Iterable<T> {
        const cached = mapGet(bag)
        if (cached === undefined) {
            const created = create(bag)
            cache.set(bag, created)
            return created
        } else {
            return cached
        }
    }
    return {
        set: cache.set,
        get: get,
    }
}