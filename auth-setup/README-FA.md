# تکمیل ورود واخان — بدون تغییر سرور از محیط توسعه

نسخهٔ0.2.79/build94 نصب‌شده است. Google فعلی از مسیر مرورگر/صفحهٔ تأیید استفاده می‌کند؛ این همان مسیر مستقیمی نیست که مالک خواسته است. SDK رسمی Google روی هر دو پلتفرم در کد وجود دارد، ولی شناسهٔ OAuth بومی هنوز تنظیم نشده است. Gmail ارسال OTP هم هنوز تنظیم نشده است. آماده‌شدن ابزار به معنی فعال‌شدن این دو سرویس نیست.

## انتخاب حساب Google و ورود مستقیم

کنسول پروژهٔ Web OAuth فعلی: https://console.cloud.google.com/auth/clients?project=1072496132573
با حساب Google دارای دسترسی به پروژه باز شود. اگر دسترسی نیست، پروژه یا حساب درست باید توسط مالک مشخص شود؛ شناسهٔ ساختگی یا Web ID به جای iOS ID قرار نگیرد.

برای iOS یک OAuth client از نوع iOS با Bundle ID واقعی `app.wakhan.music` لازم است. برای Android یک client از نوع Android با package `app.wakhan.music` و SHA-1 گواهی اصلی APK نصب‌شده لازم است. `google-public-info.py` فقط این اطلاعات عمومی و Web Client ID فعلی را از APK/config عمومی سرور می‌خواند؛ keystore، رمز یا دیتابیس را نمی‌خواند و سرویس را تغییر نمی‌دهد.

فقط Client IDهای عمومی با پسوند apps.googleusercontent.com لازم‌اند؛ Client Secret، رمز یا کلید خصوصی را در گفتگو ارسال نکنید. بعد از دریافت شناسه‌ها، تنظیم عمومیِ سرور و فایل `signin-public.json` پروژهٔ موبایل کامل می‌شوند؛ آیفون به خروجی تازه با GIDClientID/GIDServerClientID و URL scheme صحیح نیاز دارد. Android0.2.79 SDK را دارد، اما ثبت package و SHA-1 در Google Cloud و فعال‌سازی تنظیم عمومی لازم است. bundle ID پس از امضای Sideloadly باید با client iOS برابر باشد. انتخاب حساب و ورود مستقیم باید روی گوشی واقعی تست شود؛ تا آن زمان فعال‌شده محسوب نیست.

## فرستندهٔ موقت Gmail برای کد ایمیل

مالک انتخاب را واگذار کرد؛ فرستندهٔ موقت Gmail مخصوص واخان انتخاب شد. با دامنهٔ اختصاصی آینده می‌توان فرستنده را عوض کرد؛ UIDها و روش ورود کاربران به این آدرس فرستنده وابسته نیستند.

1. با Gmail فرستنده در https://myaccount.google.com/security تأیید دومرحله‌ای را فعال کنید.
2. در https://myaccount.google.com/apppasswords یک App Password برای Wakhan بسازید.
3. ابزار `setup-email.py --configure` را فقط روی سرور در ترمینال تعاملی اجرا کنید. آدرس همان Gmail و App Password16حرفی را می‌پرسد. رمز مخفی وارد می‌شود؛ آن را به گفتگو یا shell command نچسبانید.
4. ابزار یک کد6رقمی آزمایشی به همان Gmail می‌فرستد؛ آن کد را داخل ترمینال وارد کنید. حساب یا session واخان ساخته نمی‌شود.
5. فقط پس از تأیید دریافت، تنظیمات خصوصی runtime پشتیبان گرفته می‌شوند و پنج کلید موجود WKA_SMTP_HOST/PORT/USER/PASS و WKA_MAIL_FROM تغییر می‌کنند. TLS معتبر روی smtp.gmail.com:587 استفاده می‌شود. فقط wakhan-app دوباره راه‌اندازی می‌شود؛ در خطا تنظیم قبلی برمی‌گردد. رمز داخل فایل خصوصی سرور می‌ماند. پشتیبان خصوصی را ارسال نکنید.
6. برنامهٔ آیفون/اندروید را کامل ببندید و دوباره باز کنید تا email=true خوانده شود. برای همین تغییر SMTP بیلد تازه لازم نیست. ورود/ثبت‌نام با ایمیل هم باید در برنامه تست شود.

بدون `--configure` ابزار فقط وضعیت وجود کلیدها را به صورت تنظیم‌شده/خالی چاپ می‌کند. هیچ مقدار خصوصی در گزارش چاپ نمی‌شود. اگر تنظیم systemd با JSON تضاد داشته باشد، ابزار به‌جای حدس‌زدن یا ویرایش سرویس‌ها متوقف می‌شود. SSH، VPN، فایروال، DB و تنظیم Google تغییر نمی‌کنند.10 آزمون محلی موفق‌اند؛ ارسال واقعی تا اجرای مالک با حساب خودش تأیید نشده است.

### بلاک دریافت اطلاعات عمومی Google

این بلاک فقط اطلاعات لازم برای فرم Android در Google Cloud را چاپ می‌کند؛ نصب یا restart ندارد:

```bash
curl -fsSL 'https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/2e17038d3d3e1926a8227ffe05db19682d695483/auth-setup/google-public-info.py' -o /root/wakhan-google-public-info.py &&
echo 'c9c378a8f325c4333de8cc50cb7c9dd802e319de0e596a2edc48c4cfb20650fd  /root/wakhan-google-public-info.py' | sha256sum -c - &&
python3 /root/wakhan-google-public-info.py
```

### بلاک تنظیم خصوصی Gmail

پس از ساخت App Password در همان حساب Gmail فرستنده، این بلاک روی سرور اجرا شود. رمز فقط در prompt مخفی ترمینال وارد شود:

```bash
curl -fsSL 'https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/2e17038d3d3e1926a8227ffe05db19682d695483/auth-setup/setup-email.py' -o /root/wakhan-setup-email.py &&
echo '2dd188d8b9848d5cda139eaba0e0e172aa6ce16bae504643d22945f434e4326f  /root/wakhan-setup-email.py' | sha256sum -c - &&
python3 /root/wakhan-setup-email.py --configure
```
