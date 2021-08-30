<template>
  <Page actionBarHidden="true" class="appcolor">
    <StackLayout
      class="form"
      height="100%"
      verticalAlignment="center"
      paddingBottom="20px"
    >
      <StackLayout>
        <Label 
            fontSize="lg"
            padding="25"
            textWrap="true"
            textAlignment="center"
            v-if="lastScannedCode"
            :text="`Last scanned code: ${lastScannedCode.code}`"
        />
        <Label
          hint="scan a code"
          fontSize="30px"
          textTransform="uppercase"
          v-if="lastScannedCode"
          :text="lastScannedCode.status"
          :class="lastScannedCode.status"
          textAlignment="center"
        />
        <Button
          fontSize="20px"
          text="Scan"
          @tap="performScan()"
          class="buttoncolor"
        >
        </Button>
        <Button
          fontSize="20px"
          text="Continuous Scan"
          @tap="continuousScan()"
          class="buttoncolor"
        >
        </Button>

            <ScrollView height="200">
                <StackLayout>
                    <FlexBoxLayout :key="index" v-for="(codeobj, index) in results">
                        <Label :text="codeobj.code" width="50%" textAlignment="center" fontSize="lg"/>
                        <Label :text="codeobj.status" width="50%" textAlignment="center" :class="codeobj.status" fontSize="lg"/>
                    </FlexBoxLayout>
                </StackLayout>
            </ScrollView>
        <Label :text="results.length"/>
      </StackLayout>
    </StackLayout>
  </Page>
</template>

<script>
// const sound = require("nativescript-sound");
import { BarcodeScanner } from "nativescript-barcodescanner";
import { Http } from '@nativescript/core'

export default {
  computed: {
    lastScannedCode() {
      return this.results[0];
    },
  },

  props: {
    token: String,
  },
  created() {
    // this.sounds.success = sound.create("~/assets/success.mp3");
    // this.sounds.failure = sound.create("~/assets/invalid.mp3");
    // this.sounds.scanned = sound.create("~/assets/scanned2.mp3")
  },
  data() {
    return {
      sounds: {
        success: null,
        failure: null,
      },

      barcodescanner: null,

      result: {
        status: [],
        code: [],
      },

      results: [],

    };
  },
  methods: {
    performScan() {
      const barcodescanner = new BarcodeScanner();
      barcodescanner
        .scan({
          formats: "QR_CODE",
          showTorchButton: true,
          torchOn: false,
          resultDisplayDuration: 200,
          beepOnScan: true,
          openSettingsIfPermissionWasPreviouslyDenied: true,
        })
        .then(
          async (result) => {
            await this.submitQR(result.text);
            // if (this.lastScannedCode.status === "valid") {
            //   this.sounds.success.play();
            // } else if (this.lastScannedCode.status === "invalid") {
            //   this.sounds.failure.play();
            // } else if (this.lastScannedCode.status === "scanned") {
            //   this.sounds.scanned.play();
            // }
          },
          (error) => {
            console.log("No scan: " + error);
          }
        );
    },
    continuousScan() {
      const barcodescanner = new BarcodeScanner();
      let count = 0;
      barcodescanner
        .scan({
          formats: "QR_CODE",
          // this callback will be invoked for every unique scan in realtime!
          continuousScanCallback: async (result) => {
            count++;
            await this.submitQR(result.text);
            if (count === 10) {
              barcodescanner.stop();
            }
          },
          reportDuplicates: false,
        })
        .then(
          function () {
            console.log(
              "We're now reporting scan results in 'continuousScanCallback'"
            );
          },
          function (error) {
            console.log("No scan: " + error);
          }
        );
    },
    async submitQR(code) {
      try {
        const response = await Http.request({
          url: 'https://dev-api.heme.ro/code/validate',
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          content: JSON.stringify({ code }),
        })

        this.result = {
          status: response.content.toString(),
          code,
        };

        this.results.unshift(this.result);

        return Promise.resolve();
        //console.log(this.status);
        //console.log(response);
      } catch (e) {
          this.results.unshift({status: 'error', code: code})
        console.log(e);
        return Promise.reject(e);
      }
      finally{
          this.result = {
            status: "",
            code: "",
          };
      }
    },
  },
};
</script>

<style>
.valid {
  color: rgb(120, 180, 89);
}
.invalid {
  color: rgb(255, 0, 0);
}
.scanned {
  color: rgb(186, 194, 79);
}
.error {
  color: rgb(31, 23, 23);
}
.testcolor {
  background-color: rgb(234, 250, 17);
}

.textcolor {
  text-align: center;
  color: rgb(238, 241, 241);
}

.appcolor {
  background: rgb(224, 234, 255);
}

.debug {
  border: 1px solid red;
}

.buttoncolor {
  background: rgb(238, 241, 241);
}
</style>