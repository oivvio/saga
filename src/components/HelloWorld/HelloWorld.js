import { defineComponent } from "vue";
import SagaQrReader from "../SagaQrReader/SagaQrReader.vue";
class Reporter {
    constructor(firstName, age) {
        this.firstName = firstName;
        this.age = age;
    }
    increment() {
        console.log("You pushed me");
        this.age++;
    }
}
export default defineComponent({
    name: "HelloWorld",
    props: {
        msg: String,
    },
    data: function () {
        return {
            count: 1,
            isDisabled: false,
            someAttribute: "disabled",
            message: "",
            callback: function () {
                console.log("Cause I'm close to the edge! ", this.count);
                this.count--;
            },
            user: {
                firstName: "Mark",
                lastName: "Felt",
                age: 42,
            },
            showItAll: true,
            reporter: new Reporter("Bob", 30),
        };
    },
    methods: {
        increment() {
            this.user.age++;
        },
        identifcationPlease() {
            return this.user.age * 10;
        },
    },
    computed: {
        fullName() {
            return this.user.firstName + " " + this.user.lastName;
        },
        tooOld() {
            return this.user.age > 45;
        },
    },
    components: { SagaQrReader },
    created: function () {
        console.log("We were gods on our world!");
        console.log(this);
    },
});
//# sourceMappingURL=HelloWorld.js.map