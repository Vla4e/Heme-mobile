<template>
  <Page actionBarHidden="true">
    <FlexboxLayout flexDirection="column" height="100%">
      <StackLayout>
        <BarcodeScanner
          row="1"
          height="300"
          formats="QR_CODE"
          beepOnScan="true"
          reportDuplicates="false"
          preferFrontCamera="false"
          :pause="isiosscannerpaused"
          @scanResult="onScanResult"
          v-if="isIOS"
        />
      </StackLayout>
      <StackLayout flexGrow="1" />
      <FlexboxLayout
        flexDirection="column"
        paddingBottom="20"
        paddingLeft="10"
        paddingRight="10"
      >
        <StackLayout paddingBottom="20">
          <ScrollView height="200" paddingBottom="20">
            <StackLayout verticalAlignment="bottom">
              <FlexBoxLayout :key="index" v-for="(codeobj, index) in results">
                <Label
                  :text="codeobj.code"
                  width="50%"
                  textAlignment="center"
                />
                <Label
                  :text="codeobj.status"
                  width="50%"
                  textAlignment="center"
                  :class="codeobj.status"
                  textTransform="uppercase"
                />
              </FlexBoxLayout>
            </StackLayout>
          </ScrollView>
        </StackLayout>
        <Label
          textWrap="true"
          textAlignment="center"
          v-if="lastScannedCode"
          :text="`Last scanned code: ${lastScannedCode.code}`"
          paddingBottom="20"
        />
        <Label
          fontSize="30"
          textTransform="uppercase"
          v-if="lastScannedCode"
          :text="lastScannedCode.status"
          :class="lastScannedCode.status"
          textAlignment="center"
          paddingBottom="20"
        />
        <StackLayout flexGrow="1" />
        <FlexboxLayout alignItems="center" width="100%">
          <Button flexGrow="1" fontSize="20" text="Scan" @tap="performScan()" />
          <Label text="Continuous Mode" marginRight="5" />
          <Switch v-model="isContinuous" />
        </FlexboxLayout>
      </FlexboxLayout>
    </FlexboxLayout>
  </Page>
</template>

<script>
import { Application, Http } from "@nativescript/core"
import { BarcodeScanner } from "nativescript-barcodescanner"

const barcodescanner = new BarcodeScanner()
const audio = require("nativescript-audio")
const player = new audio.TNSPlayer()

export default {
  props: {
    token: String,
  },
  data() {
    return {
      isContinuous: false,
      sounds: {
        success: null,
        failure: null,
      },
      isiosscannerpaused: false,
      result: {
        status: [],
        code: [],
      },
      results: [],
    }
  },
  computed: {
    lastScannedCode() {
      return this.results[0]
    },
    isIOS() {
      return !!Application.ios
    },
  },
  watch: {
    isContinuous: {
      handler: function(val) {
        if (val) this.isiosscannerpaused = false
      },
      immediate: true
    }
  },
  methods: {
    onScanResult(e) {
      this.isiosscannerpaused = !this.isContinuous
      this.submitQR(e.text)
    },
    playSound(fileName) {
      player.playFromUrl({
        audioFile: fileName,
        loop: false,
      })
    },
    performScan() {
      if (!this.isIOS) {
        if (this.isContinuous) {
          this.continuousScan()
        } else {
          this.performScanSingle()
        }
      } else {
        this.isiosscannerpaused = false
      }
    },
    async performScanSingle() {
      const result = await barcodescanner.scan({
        formats: "QR_CODE",
        showTorchButton: false,
        resultDisplayDuration: 200,
        beepOnScan: true,
        openSettingsIfPermissionWasPreviouslyDenied: true,
        reportDuplicates: false,
      })
      await this.submitQR(result.text)
    },
    continuousScan() {
      barcodescanner.scan({
        formats: "QR_CODE",
        showTorchButton: false,
        resultDisplayDuration: 200,
        beepOnScan: true,
        openSettingsIfPermissionWasPreviouslyDenied: true,
        continuousScanCallback: async (result) => {
          await this.submitQR(result.text)
        },
        reportDuplicates: false,
      })
    },
    async submitQR(code) {
      try {
        const response = await Http.request({
          url: "https://dev-api.heme.ro/code/validate",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          content: JSON.stringify({ code }),
        })

        if (response.statusCode >= 400) throw {}

        const result = {
          status: response.content.toString().replace('"', "").replace('"', ""),
          code,
        }
        this.results.unshift(result)

        if (this.lastScannedCode.status === "valid") {
          this.playSound("~/assets/success.mp3")
        } else if (this.lastScannedCode.status === "invalid") {
          this.playSound("~/assets/invalid.mp3")
        } else if (this.lastScannedCode.status === "scanned") {
          this.playSound("~/assets/scanned2.mp3")
        }
        return Promise.resolve()
      } catch (e) {
        this.results.unshift({ status: "error", code })
        this.playSound("~/assets/invalid.mp3")
        return Promise.reject(e)
      }
    },
  },
}
</script>

<style>
.valid {
  color: rgb(120, 180, 89);
}
.invalid,
.error {
  color: rgb(255, 0, 0);
}
.scanned {
  color: rgb(186, 194, 79);
}
</style>