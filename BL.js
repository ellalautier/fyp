var mainMemorySize = 1024;

var mainMemoryArray = [["FREE", 0, mainMemorySize-1]];
var instructionArray=[[]];

//name, size
var processList=[[]]; 
var entryExitPoints=[];

var memAccesses=0;

var baseReg, limitReg;
var allocationPolicy;

$(document).ready(function() {
      
     // $("#runNextInstruction").hide();
 
 
      drawMainMemory();
      drawData();
      //drawInstructions();
   
});

function save(){
  
  if(instructionArray[0].length<1){
    alert("Error: No instructions");
    return;
  }
  
  var dataToSave=document.getElementById("toSave");
  var data={
    inst:instructionArray,
    proc:processList
  };
  
  
  
  var file="text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  //console.log(file);
  dataToSave.setAttribute("href", "data:"+file);  
  dataToSave.setAttribute("download", "memMgmt.json");
  dataToSave.click();

}




function load(){
  
  var input=document.getElementById("loadedFile");
  console.log(input);
  var fileContents, fileText;
  
  if(!window.FileReader){
    alert("Not supported by browser");
  }else{
    if(!input.files.length){
      alert("Error: No file found");
      return;
    }
    var file=input.files[0];
    var fr=new FileReader();
    fr.readAsText(file, "UTF-8");
    fr.onload=function(evt){
      fileContents=evt.target.result;
      //console.log(fileContents);
      fileText=JSON.parse(fileContents);
      processList=fileText.proc;
      instructionArray=fileText.inst;
      findEntryExit(instructionArray);
      resetAll();
      
    }
    
    
    
   // console.log(instructionArray);
  }
  
  
}

function loadExample1(){
  instructionArray=[["B",50],["A",10],["B",100],["A",140],["C",70],["A",25],["D",15],["C",30],["D",175],["A",20],["E",80],["A",90],["E",5]];
  processList=[["A",200],["B",400],["C",200],["D",175], ["E", 100]] ;
  findEntryExit(instructionArray);
  resetAll();
}

function loadExample2(){
  instructionArray=[["B",50],["A",10],["B",100],["A",240],["A",25],["A",20],["A",90]];
  processList=[["A",200],["B",400]] ;
  findEntryExit(instructionArray);
  resetAll();
}

function resetAll(){
  counter=0;
  prevBlock=null;
  mainMemoryArray = [["FREE", 0, mainMemorySize-1]];
  memAccesses=0;
  $("#baselimit").empty();
  drawInstructions();
  drawMainMemory();
  drawData();
  baseReg=null;
  limitReg=null;
}

function resetSim(){
  resetAll();
  if(instructionArray[0][0]==undefined){
      $("#instructions").empty();   
  }
}



function saveSetup(){
  resetSim();
  allocationPolicy=$("#memAllocPolicy").val();
  $("#nextInstrButton").show();
  alert("Success");

}




var counter=0;
var prevBlock;
function runInstr(){
    
    //no instructions found or all executed
  if(instructionArray[0].length==0){
    alert("No instructions");
  }else if(counter==instructionArray.length){      
    alert("Instructions executed successfully");
    resetAll();
    
    
  }else{
    //clearing previous row
    if(counter>0){
      $("#instructionRow"+(counter-1)).removeClass("selectedInstr");
      $("#memoryRow"+prevBlock).removeClass("selectedMemory");
    }
    $("#instructionRow"+counter).addClass("selectedInstr");
        //console.log(counter);

    //check for process entry and exits
    for(var i=0;i<entryExitPoints.length;i++){
      if(counter==entryExitPoints[i][2]){
        removeProcessFromMem(entryExitPoints[i][0]);
        drawMainMemory();
        break;
      }
    }
    
    for(var i=0;i<entryExitPoints.length;i++){
      if(counter==entryExitPoints[i][1]){
        loadProcessToMem(entryExitPoints[i][0]);
        //console.log(i);
        drawMainMemory();
        break;
      }
    }
    
    //console.log(entryExitPoints);
       
    var success=false;
    for(var i=0; i<mainMemoryArray.length; i++){
        if(mainMemoryArray[i][0]==instructionArray[counter][0]){
          //console.log(i);
          baseReg=mainMemoryArray[i][1];
          limitReg=mainMemoryArray[i][2]-mainMemoryArray[i][1]+1;
          
          //ensuring memory access is valid
          if(instructionArray[counter][1]<=limitReg){
            memAccesses++;
            success=true;
            drawBaseLimit();
            drawData();
            $("#memoryRow"+i).addClass("selectedMemory");
            //console.log(i);
            prevBlock=i;

          }
        }
    }
    
    counter++;
  }

  
  if(success==false){
    //alert("Error: this address does not belong to this process");
    $("#infoColumn").prepend("<p style='color: red'> Error: this address does not belong to this process</p> ")
    /*$("#memoryRow"+prevBlock).removeClass("selectedMemory");
    $("#instructionRow"+(counter-1)).removeClass("selectedInstr");
    counter=0;   */
    resetAll();
  }
}

function drawData(){
  $("#data").empty();
  var data=document.createElement("span");
  data.appendChild(document.createTextNode("# Memory Accesses: "));
  data.appendChild(document.createTextNode(memAccesses));
  document.getElementById("data").appendChild(data);
}


//BASE LIMIT FUNCTIONS
function drawBaseLimit(){
  $("#baselimit").empty();
  var baseLimitPanel=document.createElement("div");
  baseLimitPanel.className="baseLimitPanel";
  
  var header = document.createElement("div");
  header.className = "header2";
  header.appendChild(document.createTextNode("Process Being Executed"));
  baseLimitPanel.appendChild(header);
  
  //table
  var table=document.createElement("table");
  table.className="table";
  
  var thead=document.createElement("thead");
  var tr=document.createElement("tr");
  
  var processColumn=document.createElement("th");
  processColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(processColumn);
  var baseColumn = document.createElement("th");
  baseColumn.appendChild(document.createTextNode("Base Register"));
  tr.appendChild(baseColumn);
  var limitColumn = document.createElement("th");
  limitColumn.appendChild(document.createTextNode("Limit Register"));
  tr.appendChild(limitColumn);
  
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  var row=document.createElement("tr");
  var elem0=document.createElement("td");
  elem0.appendChild(document.createTextNode(instructionArray[counter][0]));
  var elem1=document.createElement("td");
  elem1.appendChild(document.createTextNode(baseReg));
  var elem2=document.createElement("td");
  elem2.appendChild(document.createTextNode(limitReg));
  
  row.appendChild(elem0);
  row.appendChild(elem1);
  row.appendChild(elem2);
  table.appendChild(row);
  
  baseLimitPanel.appendChild(table);
  document.getElementById("baselimit").appendChild(baseLimitPanel);
}


//INSTRUCTION FUNCTIONS
function drawInstructions(){
  $("#instructions").empty();
  var instructionsPanel = document.createElement("div");
  instructionsPanel.className = "instructionsPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Instructions"));
  instructionsPanel.appendChild(header);
  // Main memory table
  var table = document.createElement("table");
  table.className = "table";
  // Names of columns
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  // First column 
  var pidColumn = document.createElement("th");
  pidColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(pidColumn);
  // 2nd column 
  var addrColumn = document.createElement("th");
  var divCentred = document.createElement("div");
  divCentred.setAttribute("style", "padding-left: 25%;");
  divCentred.appendChild(document.createTextNode("Address"));
  addrColumn.appendChild(divCentred);
  tr.appendChild(addrColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<instructionArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "instructionRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(instructionArray[i][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(instructionArray[i][1]));
   
    row.appendChild(elem0);
    row.appendChild(elem1);
    table.appendChild(row);
  }
  
        
  instructionsPanel.appendChild(table);
  document.getElementById("instructions").appendChild(instructionsPanel);
  
}

var numInstructions=1;
function addInstruction(){
  if(numInstructions<50){
    document.getElementById('instr'+numInstructions).innerHTML=
    "<td> <input type='text' id='pid"+numInstructions+"' placeholder='PID' class='form-control'/></td> <td><input type='number' id='addr"+numInstructions+"' placeholder='Address' class='form-control'/></td>";
    numInstructions++;
    $("#instructionsTable").find("tbody").append($("<tr id='instr"+(numInstructions)+ "'></tr>"));
  }
}

function removeInstruction(){
  if(numInstructions>1){
    $('#instr'+(numInstructions)).remove();
    $('#instr'+(numInstructions-1)).empty();
    numInstructions--;
  } 
}

function saveInstructions(){
   var error=false;
   
  //check that all fields are filled in 
  $('#instructionsTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && error==false){
          //console.log(this);
          alert("Fields left empty");
          error=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  if(error==false){
    for(var i=0; i<numInstructions; i++){
      var name=$("#pid"+i).val().toUpperCase();
      var addr=Number($("#addr"+i).val());
      tempTable[i]=[name,addr];
      
    }
  }
  
  //check that address is valid
  if(error==false){
    for(var i=0; i<tempTable.length;i++){
    var currentAddr=tempTable[i][1];
      if(currentAddr>=mainMemorySize || currentAddr<0){
        alert("Address not valid");
        error=true;
      }
    }
   // $("#runNextInstruction").show();
  }	
  
  if(error==false&&!nameValid(tempTable)){
    error=true;
    alert("Error: PID cannot be 'free'");
  }
  
  if(error==false && !findEntryExit(tempTable)){
    error=true;
    alert("Error: One or more of these processes do not exist");
  }
  //console.log(entryExitPoints);
  
  if(error==false){
    
    instructionArray=tempTable;
    resetAll();
    
    //console.log(ln);
   //console.log(tempTable);
  }
  
}



//MAIN MEMORY FUNCTIONS

function drawMainMemory(){
  $("#mainMemory").empty();
  var mainMemoryPanel = document.createElement("div");
  mainMemoryPanel.className = "mainMemoryPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Main Memory"));
  mainMemoryPanel.appendChild(header);
  var header2=document.createElement("div");
  header2.className="header2";
  header2.appendChild(document.createTextNode("Size: "+mainMemorySize));
  mainMemoryPanel.appendChild(header2);
  // Main memory table
  var table = document.createElement("table");
  table.className = "table";
  // Names of columns
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  // PID column 
  var pidColumn = document.createElement("th");
  pidColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(pidColumn);
  // Start column 
  var startColumn = document.createElement("th");
  var divCentred = document.createElement("div");
  divCentred.setAttribute("style", "padding-left: 25%;");
  divCentred.appendChild(document.createTextNode("Start Address"));
  startColumn.appendChild(divCentred);
  tr.appendChild(startColumn);
  // End column 
  var endColumn = document.createElement("th");
  endColumn.appendChild(document.createTextNode("End Address"));
  tr.appendChild(endColumn);
  //Size column
  var sizeColumn=document.createElement("th");
  sizeColumn.appendChild(document.createTextNode("Size"));
  tr.appendChild(sizeColumn);
  
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<mainMemoryArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "memoryRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(mainMemoryArray[i][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(mainMemoryArray[i][1]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(mainMemoryArray[i][2]));
    var elem3=document.createElement("td");
    elem3.appendChild(document.createTextNode(mainMemoryArray[i][2]-mainMemoryArray[i][1]+1));
    
    row.appendChild(elem0);
    row.appendChild(elem1);
    row.appendChild(elem2);
    row.appendChild(elem3);
    table.appendChild(row);
  }
  
        
  mainMemoryPanel.appendChild(table);
  document.getElementById("mainMemory").appendChild(mainMemoryPanel);
  

}


var numProcesses=1;
function addProcess(){
    document.getElementById('process'+numProcesses).innerHTML=
    "<td> <input type='text' id='procID"+numProcesses+"' placeholder='Process ID' class='form-control'/></td> <td><input type='number' id='procSize"+numProcesses+"' placeholder='Size' class='form-control'/></td> ";
    //document.getElementById("process"+numProcesses).after(<tr id='process"+(numProcesses+1)+ "'></tr>);
    numProcesses++;
    $("#processMemoryTable").find("tbody").append($("<tr id='process"+(numProcesses)+ "'></tr>"));
    //console.log(numProcesses);
}

function removeProcess(){
  if(numProcesses>1){
    
    $('#process'+(numProcesses)).remove();
    $('#process'+(numProcesses-1)).empty();
    numProcesses--;
  } 
 // console.log(numProcesses);
}

function saveProcesses(){
  /*var tb=$("#processMemoryTable");
  for(var i=0, cell; cell=tb.cells[i]; i++){
    if(isEmpty(cell)){
      alert("Fields left empty");
      break;
    }
  }*/
   
   
   var error=false;
   
  //check that all fields are filled in 
  $('#processMemoryTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && error==false){
          //console.log(this);
          alert("Fields left empty");
          error=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  if(error==false){
    for(var i=0; i<numProcesses; i++){
      var name=$("#procID"+i).val().toUpperCase();
      var size=Number($("#procSize"+i).val());
      tempTable[i]=[name,size];
    }
    //console.log(tempTable);
  }
  
  //check that address is valid
  if(error==false){
    for(var i=0; i<tempTable.length;i++){
      
     // console.log(tempTable[i][1]);
     // console.log(tempTable[i][2]);
      if(!sizeValid(tempTable[i][1])){
        alert("Size not valid");
        error=true;
      }
    }
  }	
  
  //console.log(tempTable);
  if(error==false&&(!nameValid(tempTable)||!noDuplicates(tempTable))){
    error=true;
    alert("PID cannot be 'free' or  duplicated");
  }
  

  
  //ensure no overlapping blocks
  if(error==false){
    error=overlapsCheck(tempTable);
    if(error) alert("Memory addresses overlap");
  }
  
  
  
  
  /*
  //check size allocations dont exceed total
  if(error==false){
    var totSize=0;
    for(var i=0; i<numProcesses; i++){
      var temp=document.getElementById("size"+i);
      totSize+=temp.val();
    }
    
    if(totSize>numProcesses){
      alert("Memory allocations exceed size of memory");
      error=true;
    }
  }
  */
  
  
  /*
  if(error==false){
    var ln = tempTable.length;
    
    tempTable.sort(function(a,b){
      return a[1]-b[1];
    })
    
    var tempTable2=[[]];
    tempTable2[0]=[tempTable[0][1], tempTable[0][2]];
    for(var i=1; i<ln; i++){
      tempTable2.push([tempTable[i][1], tempTable[i][2]]);       
    }
    
    //add free spaces
    
    if(tempTable[0][1]!=0){
      tempTable.push(["free", 0, tempTable[0][1]-1]);
    }
    if(tempTable[ln-1][2]!=mainMemorySize-1){
      tempTable.push(["free", tempTable[ln-1][2]+1, mainMemorySize-1]);
    }
    
    if(tempTable2.length>1){
      for(var i=0; i<tempTable2.length-1;i++){
        var low=tempTable2[i][1];
        var high=tempTable2[i+1][0];
        if(high!=low+1){
          tempTable.push(["free", low+1, high-1]);    
        }
        //tempTable.push(["free", tempTable[i][2]+1, tempTable[i+1][1]-1]);
      }
    }
        
    tempTable.sort(function(a,b){
      return a[1]-b[1];
    })
    
    
    //mainMemoryArray=tempTable;
    //drawMainMemory();
    
    //console.log(ln);
    //console.log(tempTable);
  }
  */
   
  if(error==false){
    processList[0]=[tempTable[0][0], tempTable[0][1]];
    for(var i=1; i<tempTable.length; i++){
      processList.push([tempTable[i][0], tempTable[i][1]]);       
    }
    
    alert("Success");
  }
  
  //console.log($("#name0").val().length);
}

//chceks for overlaps in memory table
function overlapsCheck(table){
  if(table.length==1){
    return false;
   // console.log("yes");
  }else{
    for(var k=1; k<table.length;k++){
      var start=table[k][1];
      var end=table[k][2];
      for(var j=k-1;j>=0; j--){
        if((table[j][1]<=start&&start<=table[j][2]) || (table[j][1]<=end&&end<=table[j][2])){
          return true;
        }
      }
    }
  }
  return false;
}


//checks for valid name
function nameValid(table){
  //check that none are called free
  for(var i=0; i<table.length; i++){
    if(table[i][0]=="FREE"){
      return false;
    }
  }
  
  return true;
}

//check for no duplicate names
function noDuplicates(table){
  for(var i=0; i<table.length;i++){
    for(var j=i+1; j<table.length;j++){
      if(table[i][0]==table[j][0]){
        return false;
      }
    }
  }
  return true;
}

//checks for valid address
function sizeValid(size){
  if(size>mainMemorySize){
     //console.log("2:" + start+" "+end);
    return false;
  }
  if(size<0){
     //console.log("3:" + start+" "+end);
    return false;
  }
  return true;
}



//checks if fields are empty
function isEmpty(input){
  //console.log(input.val());
  if(input.val().length==0){
    return true;
  }
  return false;
}

//passing instr list
function findEntryExit(instrTable){
  entryExitPoints=[];
  var reversedTable = instrTable.slice().reverse();
  
  
  //find first
  //find last
  for(var i=0; i<instrTable.length; i++){
    //check if already found
    if(!pidExists(entryExitPoints, instrTable[i][0])){
      //check if pid exists
      if(!pidExists(processList, instrTable[i][0])){
        return false;
      }else{
        //find first
        var first=i;
        var last;
        //find last
        for(var j=0; j<instrTable.length;j++){
          if(reversedTable[j][0]==instrTable[i][0]){
            last=instrTable.length-j-1;
            break;
          }
        }
        entryExitPoints.push([instrTable[i][0], first, last+1]);
      }
    }
  }
  return true;
}

function pidExists(table, val){
  for (var i = 0; i <table.length; i++) {
    if(table[i][0]==val){
      return true;
    }
  }
  return false;
}


function loadProcessToMem(pid){
  var procSize;
  //find process
  for(var q=0;q<processList.length;q++){
    if(processList[q][0]==pid){
      procSize=processList[q][1];
      break;
    }
  }
  
  //first fit
  if(allocationPolicy=="First Fit"){
    for(var q=0; q<mainMemoryArray.length;q++){
      var chunkSize=mainMemoryArray[q][2]-mainMemoryArray[q][1]+1;
      if(mainMemoryArray[q][0]=="FREE" &&chunkSize>=procSize){
        if(chunkSize==procSize){
          mainMemoryArray[q][0]=pid;
        }else{
          mainMemoryArray[q][0]=pid;
          var freeStart=procSize+mainMemoryArray[q][1];
          var freeEnd=mainMemoryArray[q][2];
          mainMemoryArray[q][2]=freeStart-1;
          mainMemoryArray.push(["FREE", freeStart, freeEnd]);
          mainMemoryArray.sort(function(a,b){
            return a[1]-b[1];
          })
        }
        break;
      }
    }
  }else if(allocationPolicy=="Best Fit"){    
    var smallest=9999;
    var smallestSize=mainMemorySize+1;
    for(var q=0; q<mainMemoryArray.length;q++){
      var currSize=mainMemoryArray[q][2]-mainMemoryArray[q][1]+1;
      
      if(mainMemoryArray[q][0]=="FREE"&&smallestSize>currSize && procSize<=currSize ){
        smallestSize=currSize;
        smallest=q;
      }
    }
    
    if(smallestSize==procSize){
      mainMemoryArray[smallest][0]=pid;
    }else{
      mainMemoryArray[smallest][0]=pid;
      var freeStart=procSize+mainMemoryArray[smallest][1];
      var freeEnd=mainMemoryArray[smallest][2];
      mainMemoryArray[smallest][2]=freeStart-1;
      mainMemoryArray.push(["FREE", freeStart, freeEnd]);
      mainMemoryArray.sort(function(a,b){
        return a[1]-b[1];
      })
    }
  }else if(allocationPolicy=="Worst Fit"){
    var largest=9999;
    var largestSize=0;
    for(var q=0; q<mainMemoryArray.length;q++){
      var currSize=mainMemoryArray[q][2]-mainMemoryArray[q][1]+1;
      if(mainMemoryArray[q][0]=="FREE"&&largestSize<currSize && procSize<=currSize){
        largestSize=currSize;
        largest=q;
      }
    }
    
    if(largestSize==procSize){
      mainMemoryArray[largest][0]=pid;
    }else{
      mainMemoryArray[largest][0]=pid;
      var freeStart=procSize+mainMemoryArray[largest][1];
      var freeEnd=mainMemoryArray[largest][2];
      mainMemoryArray[largest][2]=freeStart-1;
      mainMemoryArray.push(["FREE", freeStart, freeEnd]);
      mainMemoryArray.sort(function(a,b){
        return a[1]-b[1];
      })
    }
  }
  
}

function removeProcessFromMem(pid){
  var before=false;
  var after=false;
  var start, end;
  for(var p=0; p<mainMemoryArray.length; p++){
    if(mainMemoryArray[p][0]==pid){
      //check for empty space before
      if(p>0){
        if(mainMemoryArray[p-1][0]=="FREE"){
          before=true;
        }
      }
      if(p<mainMemoryArray.length-1){
        if(mainMemoryArray[p+1][0]=="FREE"){
          after=true;
        }
      }
    
      
      if(before&&after){
        start=mainMemoryArray[p-1][1];
        end=mainMemoryArray[p+1][2];
        mainMemoryArray=deleteRow(mainMemoryArray, p+1);
        mainMemoryArray=deleteRow(mainMemoryArray, p);
        p--;
        
      }else if(after&&!before){
        start=mainMemoryArray[p][1];
        end=mainMemoryArray[p+1][2];
        mainMemoryArray=deleteRow(mainMemoryArray, p+1);
      }else if(before&&!after){
        start=mainMemoryArray[p-1][1];
        end=mainMemoryArray[p][2];
        mainMemoryArray=deleteRow(mainMemoryArray, p);
        p--;
      }else{
        start=mainMemoryArray[p][1];
        end=mainMemoryArray[p][2];
      }
      mainMemoryArray[p]=["FREE", start, end];
      
      break;
    }
    
  }
}

function deleteRow(arr, row) {
   arr = arr.slice(0); 
   arr.splice(row, 1);
   return arr;
}