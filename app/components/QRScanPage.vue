<template>
  <Page actionBarHidden="true" class="appcolor">
    <StackLayout
      class="form"
      height="100%"
      verticalAlignment="bottom"
      paddingBottom="20px"
    >
      <StackLayout paddingBottom="20">
            <ScrollView height="200">
                <StackLayout verticalAlignment="bottom">
                    <FlexBoxLayout :key="index" v-for="(codeobj, index) in results">
                        <Label :text="codeobj.code" width="50%" textAlignment="center" fontSize="lg"/>
                        <Label :text="codeobj.status" width="50%" textAlignment="center" :class="codeobj.status" textTransform="uppercase" fontSize="lg"/>
                    </FlexBoxLayout>
                </StackLayout>
            </ScrollView>
      </StackLayout>
        <Label 
            fontSize="lg"
            paddingLeft="25"
            paddingRight="25"
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

        <FlexboxLayout alignItems="center" width="100%">
          <Button
            flexGrow="1"
            fontSize="20px"
            text="Scan"
            @tap="performScan()"

            class="buttoncolor"
          />
          <Label text="Continuous Mode"/>
            <Switch v-model="isContinuous" />
        </FlexboxLayout>

    </StackLayout>
  </Page>
</template>

<script>
// const sound = require("nativescript-sound");
const audio = require('nativescript-audio');
const player = new audio.TNSPlayer();
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

      isContinuous: false,

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

    playSound(fileName){
      player.playFromUrl({
          audioFile: fileName,
          loop: false,
      })
    },
    performScan(){
      if(this.isContinuous){
        this.continuousScan()
      } else {
        this.performScanSingle()
      }
    },

    performScanSingle() {
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
            if (this.lastScannedCode.status === "valid") {
              this.playSound("~/assets/success.mp3");
            } else if (this.lastScannedCode.status === "invalid") {
              this.playSound("~/assets/invalid.mp3");
            } else if (this.lastScannedCode.status === "scanned") {
              this.playSound("~/assets/scanned2.mp3");
            }
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
          status: response.content.toString().replace('"','').replace('"',''),
          code,
        };
        this.results.unshift(this.result);
        console.log(this.results)

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
</style>