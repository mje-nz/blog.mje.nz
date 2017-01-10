---
title: RFM69 frequency bands in New Zealand
---

The RFM69 series from HopeRF look like a good alternative to the Nordic radios.
They have modules available for 315&thinsp;MHz, 433&thinsp;MHz, 898&thinsp;MHz and 915&thinsp;MHz.
Different countries have different restrictions on each of these bands however, so here is the situation in New Zealand [^1].

### 315&thinsp;MHz
The 315&thinsp;MHz module has a range of 290-340&thinsp;MHz. Transmitting anywhere in that range in NZ requires a (paid) license from RSM.

### 433&thinsp;MHz
The 433&thinsp;MHz module has a range of 424-510&thinsp;MHz.
Most of this range requires a license, but there are a few narrow bands that can be used freely:

* 433.05-434.79&thinsp;MHz is limited to 14&thinsp;dBm EIRP
* 458.54-458.61&thinsp;MHz is limited to 27&thinsp;dBm EIRP
* 466.8-466.85&thinsp;MHz is limited to 27&thinsp;dBm EIRP
* 471-471.5&thinsp;MHz is limited to 20&thinsp;dBm EIRP

### 898&thinsp;MHz
The 898&thinsp;MHz module has a range of 862-890&thinsp;MHz.
864-868&thinsp;MHz is limited to 30&thinsp;dBm EIRP (or 36&thinsp;dBm if frequency hopping is used), the rest requires a license.

### 915&thinsp;MHz
The 915&thinsp;MHz module has a range of 890-1020&thinsp;MHz.
915-928&thinsp;MHz is limited to 30&thinsp;dBm EIRP (920-928&thinsp;MHz is limited to 36&thinsp;dBm with frequency hopping), the rest requires a license.
This module makes the most sense in NZ as it has by far the most spectrum available.

Spurious emissions
------------------
Generally in NZ the limit for spurious emissions is -26&thinsp;dBm peak EIRP (59&thinsp;dBμV/m at 10&thinsp;m) [^2].
Additionally, the 800-915&thinsp;MHz band has a limit of -49&thinsp;dBm and the 928-1000&thinsp;MHz band has a limit of -33&thinsp;dBm.

Compliance outside 800-1000&thinsp;MHz can be determined from the [FCC compliance test report available from HopeRF](http://www.hoperf.com/upload/docs/report/RFM69CW-915S2-FCC.pdf), if we assume that it's accurate.
Below 800&thinsp;MHz the highest value is about 30&thinsp;dBμV/m at 3&thinsp;m, which corresponds to about 20&thinsp;dBμV/m at 10&thinsp;m assuming the test was performed properly[^3].
Above 1&thinsp;GHz there is a single peak of 55.19&thinsp;dBμV/m at 3&thinsp;m at the first harmonic (around 1830&thinsp;MHz) [^4].
That corresponds to 44.73&thinsp;dBμV/m at 10&thinsp;m, which is 14.27&thinsp;dB below the NZ limit.
However, in the FCC test the module was running at the 0dBm power setting, which suggests that at a power setting of 14.27&thinsp;dBm it would reach the NZ limit at the first harmonic.
Since that frequency is used for cell tower transmissions in NZ, running an RFM69HW (the high-power variant) at full power *might* affect cellphone reception.
It could still make sense to use an RFM69HW though, since [some users](https://www.andrehessling.de/2015/02/07/figuring-out-the-power-level-settings-of-hoperfs-rfm69-hwhcw-modules/) have found it to be slightly more efficient than the RFM69W.

Compliance within the 8800-1000&thinsp;MHz band is a bit tricky though; there don't appear to be any test results available for the RFM69 modules that show the spectrum around the carrier frequency.
The datasheet says the adjacent channel power is -37&thinsp;dBm at 25&thinsp;kHz offset but doesn't give any more detail than that, so it would be best to stay within 917-926&thinsp;MHz or so to be safe.







[^1]: As specified in the [Radiocommunications Regulations (General User Radio Licence for Short Range Devices) Notice 2016 No. 2](https://gazette.govt.nz/notice/id/2016-go6047).
[^2]: See Table 2 of the [Radiocommunications Regulations (Radio Standards) Notice 2016](https://www.gazette.govt.nz/notice/id/2016-go2007).
[^3]: See [here](https://www.eeweb.com/electronics-quiz/radiated-emission-measurements-conversion).
[^4]: For some reason the peak is at a different frequency depending on the polarisation; that doesn't really matter in this context though.
