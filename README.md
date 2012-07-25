Simple as potato:

    chainy()                                // create chain
        .call(foo1)                         // asynchronously call foo1
        .call(foo2)                         // and foo2
            .when("done", foo21)            // call foo 21 when foo2 will be done
            .when("fail", foo22)            // call foo 22 if foo2 failed
        .call(foo3)
            .when("done")                   // call multiple functions when previous will be done
                .call(foo31)
                .call(foo32, [arg1, arg2])  //call foo32 with arguments
            .end()
        .together()                         // group functions
            .call(foo41)
            .call(foo42)
            .call(foo43)
        .end()
            .when("done", foo400);          // call foo400 when all functions in the group will be done

Call this.done (), to indicate that an asynchronous function completed successfully.