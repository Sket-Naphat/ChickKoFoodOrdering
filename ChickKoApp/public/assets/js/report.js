// Import the necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc ,getDoc} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2v4UuQABJJc9VxA5YKSDoeEpY00NE8Tw",
    authDomain: "chickkoapp.firebaseapp.com",
    projectId: "chickkoapp",
    storageBucket: "chickkoapp.firebasestorage.app",
    messagingSenderId: "94867797048",
    appId: "1:94867797048:web:954a36ceacbcbbc5fbe2cd",
    measurementId: "G-8VPWXNX4SS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0];
    // ตั้งค่า value ของ input ด้วย jQuery
    $('#dateInput').val(today);
    
    const reportTable = $('#reportTable').DataTable({
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'excel',
                text: 'Export to Excel',
                title: function () {
                    const selectedDate = $('#dateInput').val();
                    const selectedType = $('#orderType').val();
                    if (selectedType === "grab") {
                        return 'รายงานการขาย_Grab_วันที่_' + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อไฟล์
                    }
                    else{
                        return 'รายงานการขายวันที่_' + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อไฟล์
                    }
                    
                }
            },
            {
                extend: 'print',
                text: 'Print Report',
                title: function () {
                    const selectedDate = $('#dateInput').val();
                    const selectedType = $('#orderType').val();
                    if (selectedType === "grab") {
                        return 'รายงานการขาย_Grab_วันที่_' + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อเอกสารที่พิมพ์
                    }
                    else{
                        return 'รายงานการขายวันที่_' + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อเอกสารที่พิมพ์
                    }
                }
            }
        ]
    });

    $('#fetchDataBtn').on('click', async function () {
        const selectedDate = $('#dateInput').val();
        const selectedType = $('#orderType').val();
        if (!selectedDate) {
            alert('กรุณาเลือกวันที่');
            return;
        }
    
        const originalButtonHTML = $('#fetchDataBtn').html(); // เก็บ HTML เดิมของปุ่ม
        $('#fetchDataBtn').prop('disabled', true).html(`
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
           <span role="status">Loading...</span>
        `); // เปลี่ยนปุ่มเป็น Loading
    
        try {
            let ordersQuery = null;
            // Query orders collection
            ordersQuery = query(
                collection(db, 'orders'),
                where('orderDate', '==', selectedDate)
            );
            
            const ordersSnapshot = await getDocs(ordersQuery);
    
            let filteredOrders = []; // Declare the variable outside of the if-else block
    
            if (selectedType === "grab") {
                filteredOrders = ordersSnapshot.docs.filter(orderDoc => {
                    const orderData = orderDoc.data();
                    return orderData.locationOrder === "Grab"; // Include only "Grab" orders
                });
            } else {
                filteredOrders = ordersSnapshot.docs.filter(orderDoc => {
                    const orderData = orderDoc.data();
                    return orderData.locationOrder !== "Grab"; // Exclude "Grab" orders
                });
            }
    
            const rows = [];
            let totalSalePrice = 0;
            let totalSalePricePromptpay = 0;
            let totalSalePriceCash = 0;
            let totalCost = 0;
            let totalProfit = 0;
    
            for (const orderDoc of filteredOrders) {
                const order = orderDoc.data();
    
                for (const item of order.items) {
                    // แยก item.id เมื่อมีเครื่องหมาย +
                    const itemIds = item.id.split('+');  // แยก id ที่มี + ออกเป็นหลายๆ id
    
                    // ทำงานทีละรายการ
                    for (const id of itemIds) {
                        // Query the menu document
                        const menuDocRef = doc(db, 'menu', id.trim()); // แทรก id ที่แยกแล้วไปใช้
                        const menuDoc = await getDoc(menuDocRef);
    
                        if (menuDoc.exists()) {
                            const menuData = menuDoc.data();
    
                            const cost = menuData.cost * item.quantity;
                            const profit = (menuData.price * item.quantity) - cost;
                            const salePrice = (menuData.price * item.quantity);
    
                            // Add to the totals
                            totalSalePrice += salePrice;
                            totalSalePricePromptpay += order.dischargeType=="Promptpay"?salePrice:0,
                            totalSalePriceCash += order.dischargeType=="Cash"?salePrice:0,

                            totalCost += cost;
                            totalProfit += profit;
    
                            // Push individual row data
                            rows.push([
                                menuData.name,
                                order.customerName,
                                order.orderTime,
                                order.finishedOrderTime,
                                order.dischargeTime,
                                order.locationOrder=="forHere"?"ทานที่ร้าน":"กลับบ้าน",
                                salePrice,
                                order.dischargeType=="Promptpay"?salePrice:0,
                                order.dischargeType=="Cash"?salePrice:0,                                
                                menuData.price,
                                item.quantity,
                                cost,
                                menuData.cost,
                                profit
                            ]);
                        } else {
                            console.error(`Menu item not found: ${id}`);
                        }
                    }
                }
            }
    
            // Add the total row with the "total-row" class for green background
            rows.push([
                'Total', // Item name is "Total"
                '',
                '',
                '',
                '',
                '',
                '<p class="fs-5 fw-bold">'+totalSalePrice+'</p>' ,
                totalSalePricePromptpay,
                totalSalePriceCash,
                '', // No need for individual price
                '', // No need for individual quantity
                totalCost,
                '', // No need for individual unit cost
                '<p class="fs-5 fw-bold">'+totalProfit+'</p>'
            ]);
            
            // Update the DataTable
            reportTable.clear();
            reportTable.rows.add(rows);
            reportTable.draw();
    
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        }
        finally {
             $('#fetchDataBtn').prop('disabled', false).html(originalButtonHTML); // คืนปุ่มกลับสู่สถานะเดิม
        }
    });
    

     $('#btn_insertDataToChickkoDB').on('click', async function () {
        //call api to insert data to chickko db
        const selectedDate = $('#dateInput').val();
        if (!selectedDate) {
            alert('กรุณาเลือกวันที่');
            return;
        }
        //get token from https://chickkoapi.up.railway.app/api/auth/login 
        const response = await fetch('https://chickkoapi.up.railway.app/api/auth/login'
        // const response = await fetch('http://localhost:5036/api/auth/login'
        //const response = await fetch('http://127.0.0.1:5036/api/auth/login'
        , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'sket',
                password: 'ManU@7'
            })
        });
        const data = await response.json();
        const token = data.token;
        if (!token) {
            alert('ไม่สามารถเข้าสู่ระบบได้');
            return;
        }

        //alert('กำลังบันทึกข้อมูลไปยังฐานข้อมูลหลัก กรุณารอสักครู่... ' + token);  
        //call api http://localhost:5036/api/orders/CopyOrderFromFirestore with token and data OrderDateFrom
        // const apiResponse = await fetch('https://chickkoapi.up.railway.app/api/orders/CopyOrderFromFirestore'
        const apiResponse = await fetch('http://localhost:5036/api/orders/CopyOrderFromFirestore'
            , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                OrderDateFrom: selectedDate,
                OrderDateTo: selectedDate
            })
        });
        const apiData = await apiResponse.json();
        if (apiData.success) {
            alert('บันทึกข้อมูลสำเร็จ');
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + apiData.message);
        }
     });
});
