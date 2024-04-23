// import pulumi 
import * as pulumi from "@pulumi/pulumi";
// import aws
import * as aws from "@pulumi/aws";
// import aws x
import * as awsx from "@pulumi/awsx";
import exp = require("constants");

const vpc = new aws.ec2.Vpc("pull-vpc", {
    cidrBlock: "10.0.0.0/16",
});

const igw = new aws.ec2.InternetGateway("pull-igw", {
    vpcId: vpc.id
});

const routeTable = new aws.ec2.RouteTable("pull-rt", {
    routes:  [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: igw.id
        },
    ],
    vpcId: vpc.id
});

const subnet = new aws.ec2.Subnet("pull-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
    availabilityZone: "eu-central-1a"
});

new aws.ec2.RouteTableAssociation("pull-rt-assoc", {
    routeTableId: routeTable.id,
    subnetId: subnet.id
});

const securityGroup = new aws.ec2.SecurityGroup("pull-sg", {
    vpcId: vpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    },{
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

const ec2 = new aws.ec2.Instance("pull-ec2", {
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [securityGroup.id],
    subnetId: subnet.id,
    associatePublicIpAddress: true,
    ami: "ami-0f7204385566b32d0",
    userData: `#!/bin/bash
                yum update -y
                yum install docker -y
                service docker start
                usermod -a -G docker ec2-user
                chkconfig docker on
                docker pull stefanprodan/podinfo
                docker run -d -p 80:9898 stefanprodan/podinfo`,
});
    
export const publicIp = ec2.publicIp;

export const vpcId = vpc.id








