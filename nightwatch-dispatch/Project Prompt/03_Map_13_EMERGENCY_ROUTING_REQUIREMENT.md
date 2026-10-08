# 13. EMERGENCY ROUTING REQUIREMENT

Road network ต้องออกแบบโดยคำนึงถึงระบบ Emergency Dispatch ของเกม

Police / Fire / Medical ต้องสามารถเดินทางผ่าน road graph ได้

ดังนั้น:

* ห้ามให้ Local Road เป็น dead end มากเกินไป
* Arterial ต้องมี alternate routes
* Highway ต้องเชื่อม District หลายแห่ง
* River crossing ต้องมีหลายจุด
* ทุก District ต้องมีอย่างน้อย 2 เส้นทางเชื่อมกับพื้นที่อื่นเมื่อเป็นไปได้

รองรับอนาคต:

* Road restriction
* Road closure
* Traffic modifier
* Emergency priority
* Dynamic rerouting

---
